pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
  }

  parameters {
    string(
      name: 'BACKEND_IMAGE',
      defaultValue: '123456789012.dkr.ecr.us-east-1.amazonaws.com/autodeployx-backend',
      description: 'Fully qualified backend image repo (ECR or Docker Hub)'
    )
    string(
      name: 'FRONTEND_IMAGE',
      defaultValue: '123456789012.dkr.ecr.us-east-1.amazonaws.com/autodeployx-frontend',
      description: 'Fully qualified frontend image repo'
    )
    string(
      name: 'AWS_REGION',
      defaultValue: 'us-east-1',
      description: 'AWS region for ECR + deployments'
    )
  }

  environment {
    PYTHON = 'python3'
    NODE_VERSION = '20'
    IMAGE_TAG = "${env.GIT_COMMIT}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Backend Tests') {
      steps {
        dir('backend') {
          sh '''
            ${PYTHON} -m venv .venv
            . .venv/bin/activate
            pip install --upgrade pip
            pip install -r requirements.txt
            pytest
          '''
        }
      }
      post {
        always {
          dir('backend') {
            sh 'rm -rf .venv || true'
          }
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh '''
            if command -v corepack >/dev/null 2>&1; then
              corepack enable
            fi
            npm install -g npm@latest >/dev/null 2>&1 || true
            npm install
            npm run build
          '''
        }
      }
    }

    stage('Docker Build & Push') {
      environment {
        AWS_DEFAULT_REGION = "${params.AWS_REGION}"
      }
      steps {
        withAWS(credentials: 'aws-creds', region: params.AWS_REGION) {
          sh '''
            aws ecr get-login-password --region ${AWS_DEFAULT_REGION} \
              | docker login --username AWS --password-stdin $(echo ${BACKEND_IMAGE} | cut -d/ -f1)
            docker build -f docker/backend.Dockerfile -t ${BACKEND_IMAGE}:${IMAGE_TAG} .
            docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
            docker build -f docker/frontend.Dockerfile \
              --build-arg VITE_API_URL=https://api.example.com \
              -t ${FRONTEND_IMAGE}:${IMAGE_TAG} .
            docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
          '''
        }
      }
    }

    stage('Kubernetes Deploy') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG_FILE')]) {
          sh '''
            export KUBECONFIG=${KUBECONFIG_FILE}
            kubectl set image deployment/autodeployx-backend backend=${BACKEND_IMAGE}:${IMAGE_TAG} -n autodeployx
            kubectl set image deployment/autodeployx-frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} -n autodeployx
            kubectl rollout status deployment/autodeployx-backend -n autodeployx --timeout=180s
            kubectl rollout status deployment/autodeployx-frontend -n autodeployx --timeout=180s
          '''
        }
      }
    }
  }

  post {
    always {
      cleanWs()
    }
  }
}

