pipeline {
    agent any
    environment {
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

        stage("docker compose") {
            steps {
                sh "docker compose up --build -d"
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

        stage("deploy") {
            steps {
                sh "venv/bin/python app/main.py | tee output.log"
            }
        }
    }
}
