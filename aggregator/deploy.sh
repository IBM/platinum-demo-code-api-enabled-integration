#!/bin/bash

namespace=${1:-"cp4i"}
client_id=${2:-"edd5843d14fd23e9519d2d59d35eb65a"}
client_secret=${3:-"a0b4fdc11343c00c407e8b6caadd3987"}

hostname=`oc get ingresscontroller -n openshift-ingress-operator default -o jsonpath={.status.domain}`

echo "Deploying to $namespace"

oc new-project $namespace
oc project $namespace
oc new-build --name aggregator --binary --strategy docker 
oc start-build aggregator --from-dir . --follow

cat deployment.yaml_template |
  sed "s#{{NAMESPACE}}#$namespace#g;" | 
  sed "s#{{HOSTNAME}}#$hostname#g;" | 
  sed "s#{{CLIENT_ID}}#$client_id#g;" |
  sed "s#{{CLIENT_SECRET}}#$client_secret#g;" > deployment.yaml

oc apply -f deployment.yaml -n $namespace
oc apply -f service.yaml -n $namespace
