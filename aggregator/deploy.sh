#!/bin/bash

namespace=${1:-"cp4i"}
client_id=${2:-"c244bab2f304d2ab797010f2f8021603"}
client_secret=${3:-"2de629c41ed9b07e39735ddf2a0dc9d0"}

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
