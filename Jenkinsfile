pipeline {
        agent any
        environment {
        ENV = "dev"
        }

    stages {  
        stage("Build Virtual Environment") {
            steps { 
                sh """
                rm -rf venv
                python3 -m venv --upgrade-deps venv
                venv/bin/python -m pip install -r requirements.txt
                """
            }
        }

        stage("Docker Build Image") {
            steps {
                sh "docker build -t deploy:3.12-slim ."
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'docker_jenkins', usernameVariable: 'DOCKER_USR', passwordVariable: 'DOCKER_PSW')
                ]) {
                    sh "echo \$DOCKER_PSW | docker login -u \$DOCKER_USR --password-stdin"
                }
            }
        }

        stage("Run Tests") {
            steps {
                sh """
                venv/bin/python -m pip install httpx
                venv/bin/python -m pytest test_case.py --junitxml=report.xml
                """
            }
            post {
                always {
                    junit 'report.xml'
                }
            }
        }

        stage("Push Image to Docker Hub") {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'docker_jenkins', usernameVariable: 'DOCKER_USR', passwordVariable: 'DOCKER_PSW')
                ]) {
                    sh """
                    # Tag the image with the Docker Hub username and push
                    docker tag deploy:3.12-slim \$DOCKER_USR/deployment:3.12-slim
                    docker push \$DOCKER_USR/deployment:3.12-slim
                    """
                }
            }
        }

        stage("Deploy") {
            steps {
                sh "venv/bin/python -m app.main > output.log 2>&1 &"
            }
        }
    }
}
