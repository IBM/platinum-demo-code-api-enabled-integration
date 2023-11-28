package com.ibm.demo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.http.HttpResponse.ResponseInfo;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class RESTRequest 
{
    private String endpoint;
    private String method;
    private String payload;
    public static String GET = "GET";
    public static String POST = "POST";
    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy.MM.dd.HH.mm.ss");
    static SSLContext sc=null;
    
    public String getEndpoint() 
    {
        return endpoint;
    }
    public void setEndpoint(String endpoint) 
    {
        this.endpoint = endpoint;
    }
    public String getMethod() 
    {
        return method;
    }
    public void setMethod(String method) 
    {
        this.method = method;
    }
    public String getPayload() 
    {
        return payload;
    }
    public void setPayload(String payload) 
    {
        this.payload = payload;
    }
    public RESTRequest(String endpoint, String method, String payload) 
    {
        this.endpoint = endpoint;
        this.method = method;
        this.payload = payload;
    }
    
    public String invoke()
    {
        try 
        {
            HttpsURLConnection connection = (HttpsURLConnection)(new URL(getEndpoint())).openConnection();
            connection.setRequestMethod(getMethod());
            if(!getMethod().equals(GET))
            {
                connection.setDoOutput(true);
                OutputStream os = connection.getOutputStream();
                os.write(getPayload().getBytes());
                os.flush();
                os.close();
            }
            int responseCode = connection.getResponseCode();
            StringBuffer response = new StringBuffer();
            if(responseCode == HttpsURLConnection.HTTP_OK)
            {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                String inputLine;
                while ((inputLine=reader.readLine()) !=null)
                {
                    response.append(inputLine);
                }
                reader.close();
            }
            debug(getEndpoint() + " returned '"+ responseCode+ "' "+ response.toString());
            return response.toString();
        } 
        catch (MalformedURLException e) 
        {
            e.printStackTrace();
        } 
        catch (IOException e) 
        {
            e.printStackTrace();
        }
        return null;
    }
    
    private void debug(String data)
    {
        System.out.println(sdf.format(new Date()) + " " + data);
    }

    public static void setupSSLInsecure() 
    {
        TrustManager[] trustAllCerts = new TrustManager[]{
            new X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                    return null;
                }
                public void checkClientTrusted(
                    java.security.cert.X509Certificate[] certs, String authType) {
                }
                public void checkServerTrusted(
                    java.security.cert.X509Certificate[] certs, String authType) {
                }
            }
        };
        HostnameVerifier hostnameVerifier = new HostnameVerifier() {
            @Override
            public boolean verify(String arg0, SSLSession arg1) 
            {
                return true;
            }
        };
        try 
        {
            sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
            HttpsURLConnection.setDefaultHostnameVerifier(hostnameVerifier);
        } 
        catch (NoSuchAlgorithmException e) 
        {
            e.printStackTrace();
        } catch (KeyManagementException e) 
        {
            e.printStackTrace();
        }
    }
}
