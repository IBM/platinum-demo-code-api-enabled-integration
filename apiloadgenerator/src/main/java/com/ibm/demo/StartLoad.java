package com.ibm.demo;

import java.util.Random;

public class StartLoad 
{
    
    public static void main(String[] args) throws InterruptedException 
    {
        RESTRequest.setupSSLInsecure();
        RESTRequest balance = new RESTRequest("https://ademo-gw-datapower:9443/ibm-demo/sandbox/balance/123456", RESTRequest.GET, null);
        RESTRequest transfer = new RESTRequest("https://ademo-gw-datapower:9443/ibm-demo/sandbox/transfer", RESTRequest.POST, "");
        RESTRequest notification = new RESTRequest("https://ademo-gw-datapower:9443/ibm-demo/sandbox/notification", RESTRequest.POST, "");
        RESTRequest audit = new RESTRequest("https://ademo-gw-datapower:9443/ibm-demo/sandbox/audit", RESTRequest.POST, "");
        RESTRequest fraud = new RESTRequest("https://ademo-gw-datapower:9443/ibm-demo/sandbox/frauddetection", RESTRequest.POST, "");
        RESTRequest authentication = new RESTRequest("https://ademo-gw-datapower:9443/ibm-demo/sandbox/authentication", RESTRequest.POST, "");
        while(true)
        {
            Random random = new Random();
            int sleep = random.nextInt(1000);
            Thread.sleep(sleep);
            balance.invoke();
            transfer.invoke();
            notification.invoke();
            audit.invoke();
            fraud.invoke();
            authentication.invoke();
        }
    }
}