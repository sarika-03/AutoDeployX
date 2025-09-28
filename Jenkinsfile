pipeline {
    agent any
    environment {
        DOCKERHUB_CREDENTIALS = credentials('docker_jenkins')
        ENV = "dev"
    }

    stages {  
        stage("build") {
            steps { 
                sh """
                rm -rf venv
                python3 -m venv --upgrade-deps venv
                venv/bin/python -m pip install -r requirements.txt
                """
            }
        }


        
        stage("docker build") {
            steps {
                sh " docker build -t deploy:3.12-slim . "
            }
        }


         stage('Login to Docker') {
            steps {
                sh " echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin "
                }
            }
        }

        stage("run test") {
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
        stage("push image to docker hub") {
            steps {
                sh """
                docker tag deploy:3.12-slim sarika/deployment:3.12-slim 
                docker push sarika/deployment:3.12-slim
                """
            }
        }

        stage("deploy") {
            steps {
                sh "venv/bin/python -m app.main > output.log 2>&1 &"
            }
        }
    }
}
