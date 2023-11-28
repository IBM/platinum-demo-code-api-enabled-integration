#!/bin/bash

namespace=${1:-"cp4i"}

echo "Deploying to $namespace"

oc new-project $namespace
oc project $namespace
oc new-build --name banking --binary --strategy docker 
oc start-build banking --from-dir . --follow

cat deployment.yaml_template |
  sed "s#{{NAMESPACE}}#$namespace#g;" > deployment.yaml

oc apply -f deployment.yaml -n $namespace
oc apply -f service.yaml -n $namespace
