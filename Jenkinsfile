pipeline {
    agent {
        label 'docker-agent'
    }
    stages {
        stage('Build') {
            steps {
                script {
                    sh 'docker --version'
                    dockerapp = docker.build("registry.yuri.dev.br/limboo-remote-access-service:1.0.${env.BUILD_ID}", "-f Dockerfile .")
                }
            }
        }
        stage('Pull Image') {
            steps {
                script {
                    docker.withRegistry('https://registry.yuri.dev.br', 'DOCKER_REGISTRY_CREDENTIAL') {
                        dockerapp.push('latest')
                        dockerapp.push("1.0.${env.BUILD_ID}")
                    }
                }
            }
        }
        stage('Update Deployment File') {
            environment {
                GIT_EMAIL = "yurifranklin98@gmail.com"
                GIT_REPO_NAME = "limboo-remote-access-service"
                GIT_USER_NAME = "yurifranklin"
                GITHUB_TOKEN = credentials('GITHUB_TOKEN')
            }
            steps {
                script {
                    sh """
                        git config user.email '${GIT_EMAIL}'
                        git config user.name '${GIT_USER_NAME}'
                        sed -i \"s|image: registry.yuri.dev.br/limboo-remote-access-service:.*|image: registry.yuri.dev.br/limboo-remote-access-service:1.0.${env.BUILD_ID}|\" infra/deployment.yml
                        git add infra/deployment.yml
                        git commit -m \"jenkins: updated image to version 1.0.${env.BUILD_ID}\"
                        git push https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME} HEAD:main
                    """
                }
            }
        }
    }
}