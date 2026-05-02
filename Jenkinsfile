pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "mlops-pipeline:latest"
        REGISTRY_ID = "mlops-pipeline-registry"
    }

    stages {
        stage('Initialize') {
            steps {
                echo 'Initializing MLOps Pipeline...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Lint & Type Check') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Build Assets') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Dockerize') {
            steps {
                echo "Building Container: ${DOCKER_IMAGE}"
                sh "docker build -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to MLOps Pipeline Inference Production...'
                // Add deployment scripts here (e.g., kubectl apply or gcloud run deploy)
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deployment Successful.'
        }
        failure {
            echo 'Pipeline Failed. System check required.'
        }
    }
}
