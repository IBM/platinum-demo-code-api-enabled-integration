# Use an official JDK image
FROM maven:3.8-openjdk-18 as BUILD

# Copy the application source code
COPY src /usr/src/app/src
COPY pom.xml /usr/src/app

# Run maven to build the application
RUN mvn -f /usr/src/app/pom.xml clean package 

FROM ibmjava

COPY --from=BUILD /usr/src/app/target/api-load-generate-0.0.1-SNAPSHOT-jar-with-dependencies.jar /app.jar

CMD ["java", "-Xms256m", "-Xmx1024m", "-cp", "/app.jar", "com.ibm.demo.StartLoad"]