pipeline {
        agent any
        environment {
        DOCKERHUB_CREDENTIALS = credentials('docker_jenkins')
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
                   sh '''
                    echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin
                '''
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
                sh """
                docker tag deploy:3.12-slim sarika1731/deployment:3.12-slim 
                docker push sarika1731/deployment:3.12-slim
                """
            }
        }

        stage("Deploy") {
            steps {
                sh "venv/bin/python -m app.main > output.log 2>&1 &"
            }
        }
    }
}
