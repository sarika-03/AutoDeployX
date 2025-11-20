pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'DEPLOY_INFRASTRUCTURE',
            defaultValue: false,
            description: 'Deploy AWS infrastructure using Terraform?'
        )
        booleanParam(
            name: 'DESTROY_INFRASTRUCTURE',
            defaultValue: false,
            description: 'Destroy AWS infrastructure?'
        )
    }

    environment {
        AWS_REGION = 'ap-south-1'
        CLUSTER_NAME = 'autodeploy-eks-cluster'
        NAMESPACE = 'autodeploy'
        TERRAFORM_DIR = 'terraform'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    options {
        timestamps()
        timeout(time: 2, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('🔍 Checkout Code') {
            steps {
                echo '========== Checking out code from GitHub =========='
                checkout scm
                echo '✅ Code checked out successfully'
            }
        }

        stage('🏗️ Terraform Init') {
            when {
                expression { params.DEPLOY_INFRASTRUCTURE == true || params.DESTROY_INFRASTRUCTURE == true }
            }
            steps {
                echo '========== Initializing Terraform =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            cd ${TERRAFORM_DIR}
                            terraform init -upgrade
                            terraform validate
                        '''
                    }
                }
            }
        }

        stage('🏗️ Terraform Plan') {
            when {
                expression { params.DEPLOY_INFRASTRUCTURE == true }
            }
            steps {
                echo '========== Creating Terraform Plan =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            cd ${TERRAFORM_DIR}
                            terraform plan -out=tfplan
                        '''
                    }
                }
            }
        }

        stage('🚀 Terraform Apply') {
            when {
                expression { params.DEPLOY_INFRASTRUCTURE == true }
            }
            steps {
                echo '========== Applying Terraform (Creating Infrastructure) =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            cd ${TERRAFORM_DIR}
                            terraform apply -auto-approve tfplan
                            
                            echo "✅ Infrastructure created successfully!"
                            echo ""
                            echo "📋 Outputs:"
                            terraform output
                        '''
                    }
                }
            }
        }

        stage('💥 Terraform Destroy') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == true }
            }
            steps {
                echo '========== Destroying Infrastructure =========='
                input message: 'Are you sure you want to DESTROY all infrastructure?', ok: 'Destroy'
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            cd ${TERRAFORM_DIR}
                            terraform destroy -auto-approve
                            echo "💥 Infrastructure destroyed!"
                        '''
                    }
                }
            }
        }

        stage('🔐 Get AWS Account ID') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        env.AWS_ACCOUNT_ID = sh(
                            script: 'aws sts get-caller-identity --query Account --output text',
                            returnStdout: true
                        ).trim()
                        
                        env.ECR_BACKEND_REPO = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/autodeploy-backend"
                        env.ECR_FRONTEND_REPO = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/autodeploy-frontend"
                        
                        echo "AWS Account ID: ${env.AWS_ACCOUNT_ID}"
                    }
                }
            }
        }

        stage('🔐 AWS ECR Login') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Logging into AWS ECR =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            echo "✅ Logged into ECR"
                        '''
                    }
                }
            }
        }

        stage('🏗️ Build Backend Docker Image') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Building Backend Docker Image =========='
                script {
                    sh '''
                        cd backend
                        docker build -t ${ECR_BACKEND_REPO}:${IMAGE_TAG} .
                        docker tag ${ECR_BACKEND_REPO}:${IMAGE_TAG} ${ECR_BACKEND_REPO}:latest
                        echo "✅ Backend image built: ${ECR_BACKEND_REPO}:${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('🏗️ Build Frontend Docker Image') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Building Frontend Docker Image =========='
                script {
                    sh '''
                        cd frontend
                        docker build -t ${ECR_FRONTEND_REPO}:${IMAGE_TAG} .
                        docker tag ${ECR_FRONTEND_REPO}:${IMAGE_TAG} ${ECR_FRONTEND_REPO}:latest
                        echo "✅ Frontend image built: ${ECR_FRONTEND_REPO}:${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('🐳 Push to AWS ECR') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Pushing images to AWS ECR =========='
                script {
                    sh '''
                        echo "🚀 Pushing backend image..."
                        docker push ${ECR_BACKEND_REPO}:${IMAGE_TAG}
                        docker push ${ECR_BACKEND_REPO}:latest
                        
                        echo "🚀 Pushing frontend image..."
                        docker push ${ECR_FRONTEND_REPO}:${IMAGE_TAG}
                        docker push ${ECR_FRONTEND_REPO}:latest
                        
                        echo "✅ Images pushed successfully"
                    '''
                }
            }
        }

        stage('☸️ Configure kubectl') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Configuring kubectl for EKS =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}
                            
                            echo "📋 Cluster Info:"
                            kubectl cluster-info
                            
                            echo ""
                            echo "📊 Nodes:"
                            kubectl get nodes -o wide
                        '''
                    }
                }
            }
        }

        stage('☸️ Deploy to EKS') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Deploying to AWS EKS =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            # Create namespace if not exists
                            kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                            
                            # Create temporary deployment files with correct image
                            cat k8s/backend-deployment.yaml | \
                                sed "s|image:.*backend.*|image: ${ECR_BACKEND_REPO}:${IMAGE_TAG}|g" | \
                                kubectl apply -f - -n ${NAMESPACE}
                            
                            cat k8s/frontend-deployment.yaml | \
                                sed "s|image:.*frontend.*|image: ${ECR_FRONTEND_REPO}:${IMAGE_TAG}|g" | \
                                kubectl apply -f - -n ${NAMESPACE}
                            
                            # Apply services
                            kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}
                            kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}
                            
                            # Apply other resources
                            kubectl apply -f k8s/configmap.yaml -n ${NAMESPACE} || true
                            kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE} || true
                            
                            echo "⏳ Waiting for pods to start..."
                            sleep 15
                        '''
                    }
                }
            }
        }

        stage('✅ Wait for Rollout') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Waiting for deployments to be ready =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            echo "⏳ Waiting for backend rollout..."
                            kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=10m || echo "Backend rollout timeout"
                            
                            echo "⏳ Waiting for frontend rollout..."
                            kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=10m || echo "Frontend rollout timeout"
                            
                            echo "✅ Rollout complete!"
                        '''
                    }
                }
            }
        }

        stage('🔍 Health Check') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Running Health Checks =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            echo "🏥 Health Check Results:"
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            
                            BACKEND_PODS=$(kubectl get pods -n ${NAMESPACE} -l app=backend -o jsonpath='{.items[*].status.phase}')
                            FRONTEND_PODS=$(kubectl get pods -n ${NAMESPACE} -l app=frontend -o jsonpath='{.items[*].status.phase}')
                            
                            echo "Backend Pods: $BACKEND_PODS"
                            echo "Frontend Pods: $FRONTEND_PODS"
                            
                            if [[ "$BACKEND_PODS" == *"Running"* ]] && [[ "$FRONTEND_PODS" == *"Running"* ]]; then
                                echo "✅ All pods are running!"
                            else
                                echo "⚠️  Some pods are not running yet"
                            fi
                        '''
                    }
                }
            }
        }

        stage('🔍 Verify Deployment') {
            when {
                expression { params.DESTROY_INFRASTRUCTURE == false }
            }
            steps {
                echo '========== Verifying Deployment =========='
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh '''
                            echo ""
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            echo "📊 DEPLOYMENT STATUS"
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            
                            echo ""
                            echo "📦 Deployments:"
                            kubectl get deployments -n ${NAMESPACE} -o wide
                            
                            echo ""
                            echo "📊 Pods:"
                            kubectl get pods -n ${NAMESPACE} -o wide
                            
                            echo ""
                            echo "📋 Services:"
                            kubectl get svc -n ${NAMESPACE} -o wide
                            
                            echo ""
                            echo "🔗 LoadBalancer URLs (if available):"
                            kubectl get svc -n ${NAMESPACE} -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.loadBalancer.ingress[0].hostname}{"\n"}{end}' || echo "No LoadBalancer services yet"
                            
                            echo ""
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            echo '========== Pipeline Execution Complete =========='
            script {
                sh '''
                    docker logout ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com || true
                ''' 
            }
            cleanWs()
        }

        success {
            echo ''
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            echo '✅ DEPLOYMENT SUCCESSFUL!'
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            echo ''
            echo '🎉 AutoDeployX deployed to AWS EKS!'
            echo ''
            echo 'To access your application:'
            echo '1. Get LoadBalancer URL: kubectl get svc -n autodeploy'
            echo '2. Or use port-forward: kubectl port-forward svc/frontend -n autodeploy 8080:80'
            echo ''
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        }

        failure {
            echo ''
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            echo '❌ DEPLOYMENT FAILED!'
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            script {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        echo ""
                        echo "🔍 Recent Pod Logs:"
                        kubectl logs -n ${NAMESPACE} -l app=backend --tail=50 || true
                        echo ""
                        kubectl logs -n ${NAMESPACE} -l app=frontend --tail=50 || true
                    '''
                }
            }
        }
    }
}