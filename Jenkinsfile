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

        stage('☸️ Setup Kubernetes Namespace') {
            steps {
                echo '========== Setting up Kubernetes Namespaces =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📋 Checking cluster connection..."
                            kubectl cluster-info
                            
                            echo "🔍 Creating autodeploy namespace if not exists..."
                            kubectl get namespace ${NAMESPACE} || kubectl create namespace ${NAMESPACE}
                            
                            echo "🔍 Creating monitoring namespace if not exists..."
                            kubectl get namespace monitoring || kubectl create namespace monitoring
                            
                            echo "✅ Namespaces ready"
                        '''
                    }
                }
            }
        }

        stage('☸️ Deploy Backend to Kubernetes') {
            steps {
                echo '========== Deploying Backend to Kubernetes =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📦 Checking if backend deployment file exists..."
                            if [ ! -f "k8s/backend-deployment.yaml" ]; then
                                echo "❌ ERROR: backend-deployment.yaml not found!"
                                exit 1
                            fi
                            
                            echo "📦 Applying backend deployment..."
                            kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}
                            
                            echo "📦 Applying backend service..."
                            if [ -f "k8s/backend-service.yaml" ]; then
                                kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}
                            fi
                            
                            echo "✅ Backend manifests applied"
                            
                            echo "🔍 Verifying backend deployment exists..."
                            kubectl get deployment backend -n ${NAMESPACE}
                        '''
                    }
                }
            }
        }

        stage('☸️ Deploy Frontend to Kubernetes') {
            steps {
                echo '========== Deploying Frontend to Kubernetes =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📦 Applying frontend deployment..."
                            kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
                            
                            echo "📦 Applying frontend service..."
                            if [ -f "k8s/frontend-service.yaml" ]; then
                                kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}
                            fi
                            
                            echo "✅ Frontend manifests applied"
                        '''
                    }
                }
            }
        }

        stage('☸️ Deploy Additional Resources') {
            steps {
                echo '========== Deploying Additional Kubernetes Resources =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📦 Applying ConfigMap..."
                            kubectl apply -f k8s/configmap.yaml -n ${NAMESPACE} || echo "⚠️ ConfigMap not found or failed"
                            
                            echo "📦 Applying Ingress..."
                            kubectl apply -f k8s/ingress.yaml -n ${NAMESPACE} || echo "⚠️ Ingress not found or failed"
                            
                            echo "📦 Applying Monitoring resources..."
                            if [ -d "k8s/monitoring" ]; then
                                kubectl apply -f k8s/monitoring/ -n monitoring || echo "⚠️ Monitoring setup skipped"
                            fi
                            
                            echo "⏳ Waiting 15 seconds for pods to start..."
                            sleep 15
                        '''
                    }
                }
            }
        }

        stage('✅ Wait for Backend Rollout') {
            steps {
                echo '========== Waiting for Backend Deployment =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "🔍 Checking if backend deployment exists..."
                            if kubectl get deployment backend -n ${NAMESPACE} >/dev/null 2>&1; then
                                echo "✅ Backend deployment found"
                                echo "⏳ Waiting for backend rollout (timeout: 5 minutes)..."
                                kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=5m
                                echo "✅ Backend rollout complete!"
                            else
                                echo "❌ ERROR: Backend deployment not found!"
                                echo "Available deployments in ${NAMESPACE}:"
                                kubectl get deployments -n ${NAMESPACE}
                                exit 1
                            fi
                        '''
                    }
                }
            }
        }

        stage('✅ Wait for Frontend Rollout') {
            steps {
                echo '========== Waiting for Frontend Deployment =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "⏳ Waiting for frontend rollout (timeout: 5 minutes)..."
                            kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=5m
                            echo "✅ Frontend rollout complete!"
                        '''
                    }
                }
            }
        }

        stage('🔍 Verify Deployment') {
            steps {
                echo '========== Verifying Complete Deployment =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
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
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            echo "🌐 APPLICATION ACCESS URLS"
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            echo ""
                            echo "To access your application:"
                            echo "1. Get Minikube IP: minikube ip"
                            echo "2. Access URLs:"
                            echo "   • Frontend: http://<minikube-ip>:30080"
                            echo "   • Backend:  http://<minikube-ip>:30081"
                            echo ""
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            
                            echo ""
                            echo "🔍 Pod Health Check:"
                            BACKEND_READY=$(kubectl get pods -n ${NAMESPACE} -l app=backend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
                            FRONTEND_READY=$(kubectl get pods -n ${NAMESPACE} -l app=frontend -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
                            
                            echo "✅ Backend Pods Ready: ${BACKEND_READY}/2"
                            echo "✅ Frontend Pods Ready: ${FRONTEND_READY}/2"
                            
                            if [ "${BACKEND_READY}" -ge "1" ] && [ "${FRONTEND_READY}" -ge "1" ]; then
                                echo ""
                                echo "🎉 DEPLOYMENT SUCCESSFUL!"
                            else
                                echo ""
                                echo "⚠️ WARNING: Some pods may not be ready yet"
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
            echo ''
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            echo '✅ PIPELINE SUCCESSFUL!'
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            echo ''
            echo '🎉 AutoDeployX has been deployed successfully!'
            echo ''
            echo 'Next Steps:'
            echo '1. Get Minikube IP: minikube ip'
            echo '2. Access Frontend: http://<minikube-ip>:30080'
            echo '3. Test Backend API: curl http://<minikube-ip>:30081'
            echo ''
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        }

        failure {
            echo ''
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            echo '❌ PIPELINE FAILED!'
            echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
            script {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    sh '''
                        export KUBECONFIG=${KUBECONFIG}
                        echo ""
                        echo "🔍 DEBUGGING INFORMATION:"
                        echo ""
                        
                        echo "1. Namespaces:"
                        kubectl get namespaces | grep -E "NAME|autodeploy|monitoring"
                        
                        echo ""
                        echo "2. Deployments in autodeploy namespace:"
                        kubectl get deployments -n ${NAMESPACE} || echo "No deployments found"
                        
                        echo ""
                        echo "3. Pods in autodeploy namespace:"
                        kubectl get pods -n ${NAMESPACE} || echo "No pods found"
                        
                        echo ""
                        echo "4. Services in autodeploy namespace:"
                        kubectl get svc -n ${NAMESPACE} || echo "No services found"
                        
                        echo ""
                        echo "5. Recent Events:"
                        kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' | tail -10 || true
                        
                        echo ""
                        echo "6. Backend Pod Logs (if exists):"
                        kubectl logs -n ${NAMESPACE} -l app=backend --tail=50 || echo "No backend pods found"
                        
                        echo ""
                        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    '''
                }
            }
        }
    }
}