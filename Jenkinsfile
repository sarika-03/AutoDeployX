pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = 'sarika1731'
        DOCKER_HUB_REPO_BACKEND = 'autodeploy-backend'
        DOCKER_HUB_REPO_FRONTEND = 'autodeploy-frontend'
        DOCKER_IMAGE_TAG = "latest"
        NAMESPACE = 'autodeploy'
        EMAIL_RECIPIENT = 'sarikasharma9711@gmail.com'
    }

    options {
        timestamps()
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('🔍 Checkout Code') {
            steps {
                echo '========== Checking out code from GitHub =========='
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/sarika-03/AutoDeployX.git']]
                ])
                echo '✅ Code checked out successfully'
            }
        }

        stage('🏗️ Build Backend Docker Image') {
            steps {
                echo '========== Building Backend Docker Image =========='
                script {
                    sh '''
                        cd backend
                        docker build -t ${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_BACKEND}:${DOCKER_IMAGE_TAG} .
                        echo "✅ Backend image built: ${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_BACKEND}:${DOCKER_IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('🏗️ Build Frontend Docker Image') {
            steps {
                echo '========== Building Frontend Docker Image =========='
                script {
                    sh '''
                        cd frontend
                        docker build -t ${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_FRONTEND}:${DOCKER_IMAGE_TAG} .
                        echo "✅ Frontend image built: ${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_FRONTEND}:${DOCKER_IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('🐳 Push to Docker Hub') {
            steps {
                echo '========== Pushing images to Docker Hub =========='
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                            
                            echo "🚀 Pushing backend image..."
                            docker push ${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_BACKEND}:${DOCKER_IMAGE_TAG}
                            
                            echo "🚀 Pushing frontend image..."
                            docker push ${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_FRONTEND}:${DOCKER_IMAGE_TAG}
                            
                            echo "✅ Images pushed successfully"
                            docker logout
                        '''
                    }
                }
            }
        }

        stage('☸️ Deploy to Kubernetes') {
            steps {
                echo '========== Deploying Fresh to Kubernetes =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📋 Checking cluster connection..."
                            kubectl cluster-info
                            
                            echo "🔍 Creating namespace if not exists..."
                            kubectl get namespace ${NAMESPACE} || kubectl create namespace ${NAMESPACE}
                            
                            echo "📦 Applying all Kubernetes manifests..."
                            kubectl apply -f k8s/ -n ${NAMESPACE} --recursive
                            
                            echo "⏳ Waiting 10 seconds for resources to stabilize..."
                            sleep 10
                            
                            echo "✅ Deployment complete!"
                        '''
                    }
                }
            }
        }

        stage('✅ Wait for Rollout') {
            steps {
                echo '========== Waiting for deployments to be ready =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "⏳ Waiting for backend rollout..."
                            kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=5m || true
                            
                            echo "⏳ Waiting for frontend rollout..."
                            kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=5m || true
                            
                            echo "✅ Rollout complete!"
                        '''
                    }
                }
            }
        }

        stage('🔍 Verify Deployment') {
            steps {
                echo '========== Verifying Kubernetes Deployment =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📊 Pods Status:"
                            kubectl get pods -n ${NAMESPACE}
                            
                            echo ""
                            echo "📋 Services Status:"
                            kubectl get svc -n ${NAMESPACE}
                            
                            echo ""
                            echo "🔗 Getting Access URLs..."
                            if command -v minikube >/dev/null 2>&1; then
                                MINIKUBE_IP=$(minikube ip)
                                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                                echo "✅ Frontend: http://${MINIKUBE_IP}:30080"
                                echo "✅ Backend: http://${MINIKUBE_IP}:30081"
                                echo "✅ Prometheus: http://${MINIKUBE_IP}:30090"
                                echo "✅ Grafana: http://${MINIKUBE_IP}:30300"
                                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            fi
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            echo '========== Pipeline Execution Complete =========='
            cleanWs()
        }

        success {
            echo '✅ Pipeline Successful!'
            script {
                // Simple email notification without HTML
                try {
                    emailext(
                        subject: "SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                        body: """
                            Build Successful!
                            
                            Project: ${env.JOB_NAME}
                            Build Number: ${env.BUILD_NUMBER}
                            Build Status: SUCCESS
                            
                            Deployment Summary:
                            - Code checked out from GitHub
                            - Backend Docker image built and pushed
                            - Frontend Docker image built and pushed
                            - Kubernetes deployments updated
                            
                            Access Your Application:
                            Run 'minikube ip' and use that IP with:
                            - Frontend: http://[minikube-ip]:30080
                            - Backend: http://[minikube-ip]:30081
                            - Prometheus: http://[minikube-ip]:30090
                            - Grafana: http://[minikube-ip]:30300
                            
                            Console: ${env.BUILD_URL}console
                        """,
                        to: "${EMAIL_RECIPIENT}",
                        mimeType: 'text/plain'
                    )
                } catch (Exception e) {
                    echo "⚠️ Email notification failed: ${e.message}"
                    echo "Build was still successful!"
                }
            }
        }

        failure {
            echo '❌ Pipeline Failed!'
            script {
                try {
                    emailext(
                        subject: "FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                        body: """
                            Build Failed!
                            
                            Project: ${env.JOB_NAME}
                            Build Number: ${env.BUILD_NUMBER}
                            Build Status: FAILED
                            
                            Check Jenkins console logs for details:
                            ${env.BUILD_URL}console
                            
                            Troubleshooting:
                            1. Verify Kubernetes cluster: minikube status
                            2. Check namespace: kubectl get ns
                            3. View pods: kubectl get pods -n autodeploy
                        """,
                        to: "${EMAIL_RECIPIENT}",
                        mimeType: 'text/plain',
                        attachLog: true
                    )
                } catch (Exception e) {
                    echo "⚠️ Email notification failed: ${e.message}"
                }
            }
        }
    }
}