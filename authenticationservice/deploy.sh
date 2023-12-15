#!/bin/bash

namespace=${1:-"cp4i"}

echo "Deploying to $namespace"

hostname=`oc get ingresscontroller -n openshift-ingress-operator default -o jsonpath={.status.domain}`

oc new-project $namespace
oc project $namespace
oc new-build --name authentication --binary --strategy docker 
oc start-build authentication --from-dir . --follow

cat deployment.yaml_template |
  sed "s#{{NAMESPACE}}#$namespace#g;" | 
  sed "s#{{HOSTNAME}}#$hostname#g;" > deployment.yaml

oc apply -f deployment.yaml -n $namespace
oc apply -f service.yaml -n $namespace
