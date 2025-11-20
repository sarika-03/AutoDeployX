######################
#  TERRAFORM CONFIG
######################
terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "autodeployx-terraform-state"  # Change this to your bucket name
    key    = "terraform.tfstate"
    region = "ap-south-1"
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

######################
#  PROVIDER
######################
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AutoDeployX"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "Sarika"
    }
  }
}

######################
#  VARIABLES
######################
variable "aws_region" {
  description = "AWS Region"
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "cluster_name" {
  description = "EKS Cluster name"
  default     = "autodeploy-eks-cluster"
}

######################
#  GET AZs
######################
data "aws_availability_zones" "available" {
  state = "available"
}

######################
#  ECR REPOSITORIES
######################
resource "aws_ecr_repository" "backend" {
  name                 = "autodeploy-backend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "AutoDeployX Backend"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "autodeploy-frontend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "AutoDeployX Frontend"
  }
}

######################
#  VPC MODULE
######################
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.7.1"
  
  name = "autodeployx-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # Required for EKS
  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
  
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
  
  tags = {
    Name = "AutoDeployX VPC"
  }
}

######################
#  EKS CLUSTER
######################

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.4"
  
  cluster_name    = var.cluster_name
  cluster_version = "1.30"
  
  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.public_subnets
  
  # Cluster endpoint access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true
  
  # Enable IRSA (IAM Roles for Service Accounts)
  enable_irsa = true
  
  # Cluster addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
  
  # EKS Managed Node Groups
  eks_managed_node_groups = {
    general = {
      name           = "general-node-group"
      
      # 🟢 UPDATED: Changed instance type to t2.micro for Free Tier eligibility
      instance_types = ["t2.micro"]
      
      min_size     = 1
      max_size     = 3
      desired_size = 2
      
      disk_size = 20
      
      labels = {
        role = "general"
      }
      
      tags = {
        Name = "AutoDeployX General Nodes"
      }
    }
  }
  
  # Cluster security group additional rules
  cluster_security_group_additional_rules = {
    ingress_nodes_ephemeral_ports_tcp = {
      description                = "Nodes on ephemeral ports"
      protocol                   = "tcp"
      from_port                  = 1025
      to_port                    = 65535
      type                       = "ingress"
      source_node_security_group = true
    }
  }
  
  # Node security group additional rules
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    
    ingress_cluster_all = {
      description                   = "Cluster to node all ports/protocols"
      protocol                      = "-1"
      from_port                     = 0
      to_port                       = 0
      type                          = "ingress"
      source_cluster_security_group = true
    }
    
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
  
  tags = {
    Name = "AutoDeployX EKS Cluster"
  }
}
      
######################
#  EKS AUTH DATA
######################
data "aws_eks_cluster" "cluster" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "cluster" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}

######################
#  KUBERNETES PROVIDER
######################
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

######################
#  K8S NAMESPACE
######################
resource "kubernetes_namespace" "autodeploy" {
  metadata {
    name = "autodeploy"
    labels = {
      name = "autodeploy"
    }
  }
  
  depends_on = [module.eks]
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
    }
  }
  
  depends_on = [module.eks]
}

######################
#  AWS LOAD BALANCER CONTROLLER IAM POLICY
######################
resource "aws_iam_policy" "alb_controller" {
  name        = "AWSLoadBalancerControllerIAMPolicy"
  description = "IAM policy for AWS Load Balancer Controller"
  
  policy = file("${path.module}/alb-iam-policy.json")
}

######################
#  OUTPUTS
######################
output "cluster_name" {
  description = "EKS Cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS Cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_region" {
  description = "AWS Region"
  value       = var.aws_region
}

output "ecr_backend_url" {
  description = "ECR Backend Repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR Frontend Repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${var.cluster_name}"
}

output "configure_kubectl" {
  description = "Instructions to configure kubectl"
  value       = <<-EOT
    Run the following command to configure kubectl:
    
    aws eks update-kubeconfig --region ${var.aws_region} --name ${var.cluster_name}
    
    Then verify with:
    kubectl get nodes
  EOT
}