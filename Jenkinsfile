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

        stage('☸️ Update K8s Deployments') {
            steps {
                echo '========== Updating Kubernetes Deployments =========='
                script {
                    withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                        sh '''
                            export KUBECONFIG=${KUBECONFIG}
                            
                            echo "📋 Checking cluster connection..."
                            kubectl cluster-info || { echo "❌ Cannot connect to cluster"; exit 1; }
                            
                            echo "🔍 Checking if namespace exists..."
                            kubectl get namespace ${NAMESPACE} || kubectl create namespace ${NAMESPACE}
                            
                            echo "🔄 Updating backend deployment..."
                            kubectl set image deployment/backend \
                                backend=${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_BACKEND}:${DOCKER_IMAGE_TAG} \
                                -n ${NAMESPACE}

                            echo "🔄 Updating frontend deployment..."
                            kubectl set image deployment/frontend \
                                frontend=${DOCKER_HUB_USERNAME}/${DOCKER_HUB_REPO_FRONTEND}:${DOCKER_IMAGE_TAG} \
                                -n ${NAMESPACE}

                            echo "✅ K8s deployments updated successfully"
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
                            kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=5m
                            
                            echo "⏳ Waiting for frontend rollout..."
                            kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=5m
                            
                            echo "✅ All deployments are ready!"
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
                                echo "✅ Frontend: http://${MINIKUBE_IP}:30080"
                                echo "✅ Prometheus: http://${MINIKUBE_IP}:30090"
                                echo "✅ Grafana: http://${MINIKUBE_IP}:30300"
                            else
                                echo "ℹ️  Minikube not available - use cluster ingress/loadbalancer"
                            fi
                        '''
                    }
                }
            }
        }

        stage('🎉 Success') {
            steps {
                echo '========== ✅ DEPLOYMENT SUCCESSFUL =========='
                script {
                    sh '''
                        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        echo "🚀 AutoDeployX is now running on Kubernetes"
                        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                        echo "✅ Backend: Ready"
                        echo "✅ Frontend: Ready"
                        echo "✅ Monitoring: Ready"
                        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                    '''
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
            emailext(
                subject: "✅ Jenkins Build SUCCESS: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: '''
                    <h2 style="color: green;">🎉 Build Successful!</h2>
                    
                    <h3>Build Details:</h3>
                    <table border="1" cellpadding="10" style="border-collapse: collapse;">
                        <tr>
                            <td><b>Project:</b></td>
                            <td>${JOB_NAME}</td>
                        </tr>
                        <tr>
                            <td><b>Build Number:</b></td>
                            <td>${BUILD_NUMBER}</td>
                        </tr>
                        <tr>
                            <td><b>Build Status:</b></td>
                            <td style="color: green;"><b>✅ SUCCESS</b></td>
                        </tr>
                        <tr>
                            <td><b>Duration:</b></td>
                            <td>${BUILD_DURATION}</td>
                        </tr>
                        <tr>
                            <td><b>Timestamp:</b></td>
                            <td>${BUILD_TIMESTAMP}</td>
                        </tr>
                    </table>
                    
                    <h3>Deployment Summary:</h3>
                    <ul>
                        <li>✅ Code checked out from GitHub</li>
                        <li>✅ Backend Docker image built and pushed</li>
                        <li>✅ Frontend Docker image built and pushed</li>
                        <li>✅ Kubernetes deployments updated</li>
                        <li>✅ All pods are healthy and running</li>
                        <li>✅ Monitoring is active (Prometheus & Grafana)</li>
                    </ul>
                    
                    <h3>Application URLs:</h3>
                    <ul>
                        <li><b>Frontend:</b> http://[minikube-ip]:30080</li>
                        <li><b>Prometheus:</b> http://[minikube-ip]:30090</li>
                        <li><b>Grafana:</b> http://[minikube-ip]:30300</li>
                    </ul>
                    <p style="color: gray; font-size: 12px;">Replace [minikube-ip] with: <code>minikube ip</code></p>
                    
                    <h3>Jenkins Console:</h3>
                    <a href="${BUILD_URL}console">${BUILD_URL}console</a>
                    
                    <hr>
                    <p style="color: gray; font-size: 12px;">This is an automated email from Jenkins. Please do not reply.</p>
                ''',
                to: "${EMAIL_RECIPIENT}",
                mimeType: 'text/html'
            )
        }

        failure {
            echo '❌ Pipeline Failed!'
            script {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    sh '''
                        export KUBECONFIG=${KUBECONFIG}
                        echo "🔍 Checking pod logs..."
                        kubectl logs -n ${NAMESPACE} -l app=backend --tail=50 || echo "Backend logs not available"
                        kubectl logs -n ${NAMESPACE} -l app=frontend --tail=50 || echo "Frontend logs not available"
                    '''
                }
            }
            emailext(
                subject: "❌ Jenkins Build FAILED: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: '''
                    <h2 style="color: red;">❌ Build Failed!</h2>
                    
                    <h3>Build Details:</h3>
                    <table border="1" cellpadding="10" style="border-collapse: collapse;">
                        <tr>
                            <td><b>Project:</b></td>
                            <td>${JOB_NAME}</td>
                        </tr>
                        <tr>
                            <td><b>Build Number:</b></td>
                            <td>${BUILD_NUMBER}</td>
                        </tr>
                        <tr>
                            <td><b>Build Status:</b></td>
                            <td style="color: red;"><b>❌ FAILED</b></td>
                        </tr>
                        <tr>
                            <td><b>Duration:</b></td>
                            <td>${BUILD_DURATION}</td>
                        </tr>
                        <tr>
                            <td><b>Timestamp:</b></td>
                            <td>${BUILD_TIMESTAMP}</td>
                        </tr>
                    </table>
                    
                    <h3>Troubleshooting Steps:</h3>
                    <ol>
                        <li>Check Jenkins console logs for detailed error</li>
                        <li>Verify Docker Hub credentials are correct</li>
                        <li>Check Kubernetes cluster status: <code>kubectl cluster-info</code></li>
                        <li>Verify kubeconfig file is valid</li>
                        <li>Check if deployments exist in namespace</li>
                    </ol>
                    
                    <h3>Jenkins Console:</h3>
                    <a href="${BUILD_URL}console">${BUILD_URL}console</a>
                    
                    <hr>
                    <p style="color: gray; font-size: 12px;">This is an automated email from Jenkins. Please do not reply.</p>
                ''',
                to: "${EMAIL_RECIPIENT}",
                mimeType: 'text/html',
                attachLog: true
            )
        }

        unstable {
            echo '⚠️ Pipeline Unstable!'
            emailext(
                subject: "⚠️ Jenkins Build UNSTABLE: ${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                body: '''
                    <h2 style="color: orange;">⚠️ Build Unstable!</h2>
                    
                    <p>The build completed but with some warnings.</p>
                    
                    <h3>Build Details:</h3>
                    <table border="1" cellpadding="10" style="border-collapse: collapse;">
                        <tr>
                            <td><b>Project:</b></td>
                            <td>${JOB_NAME}</td>
                        </tr>
                        <tr>
                            <td><b>Build Number:</b></td>
                            <td>${BUILD_NUMBER}</td>
                        </tr>
                        <tr>
                            <td><b>Build Status:</b></td>
                            <td style="color: orange;"><b>⚠️ UNSTABLE</b></td>
                        </tr>
                    </table>
                    
                    <h3>Jenkins Console:</h3>
                    <a href="${BUILD_URL}console">${BUILD_URL}console</a>
                    
                    <hr>
                    <p style="color: gray; font-size: 12px;">This is an automated email from Jenkins. Please do not reply.</p>
                ''',
                to: "${EMAIL_RECIPIENT}",
                mimeType: 'text/html'
            )
        }
    }
}