pipeline {
  agent any
  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  environment {
    REGISTRY = 'ghcr.io/YOUR_USERNAME'
    IMAGE    = "${REGISTRY}/orders-platform"
    TAG      = "${env.GIT_COMMIT?.take(7) ?: 'local'}"
  }
  stages {
    stage('Install') {
      steps { sh 'npm ci' }
    }
    stage('Lint') {
      steps { sh 'npm run lint --if-present' }
    }
    stage('Test') {
      steps { sh 'npm test --if-present' }
    }
    stage('Build Image') {
      steps { sh 'docker build -t $IMAGE:$TAG .' }
    }
    stage('Trivy Scan') {
      steps {
        sh 'trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed $IMAGE:$TAG'
      }
    }
    stage('Push') {
      when { branch 'main' }
      steps {
        withCredentials([usernamePassword(credentialsId: 'registry-creds', usernameVariable: 'U', passwordVariable: 'P')]) {
          sh 'echo $P | docker login ghcr.io -u $U --password-stdin'
          sh 'docker push $IMAGE:$TAG'
        }
      }
    }
    stage('Deploy') {
      when { branch 'main' }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'cd k8s/overlays/dev && kustomize edit set image $IMAGE=$IMAGE:$TAG'
          sh 'kubectl apply -k k8s/overlays/dev'
          sh 'kubectl -n orders rollout status deployment/orders-api --timeout=120s'
        }
      }
    }
  }
  post {
    failure { echo 'Pipeline failed' }
    always  { sh 'docker image prune -f || true' }
  }
}
