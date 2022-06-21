# THESE ARE MY OWN KEYS FOR MY OWN MACHINE

## GET UR FUCKING OWN

### REMOVE ALL FILES APART FROM ***INFO2222.TEXT.EXT***

Add the following lines if you on mac to get cert files.

------

openssl genrsa -des3 -out myCA.key 2048

openssl req -x509 -new -nodes -key myCA.key -sha256 -days 1825 -out myCA.pem

-- LINUX --

sudo apt-get install -y ca-certificates

sudo cp ./myCA.pem /usr/local/share/ca-certificates/myCA.crt

sudo update-ca-certificates

-- MAC --

sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" myCA.pem

-- ALL --

openssl genrsa -out localhost.key 2048

### AT THIS POINT NAME THE COMMON NAME FOR THIS CERT localhost

openssl req -new -key localhost.key -out localhost.csr

openssl x509 -req -in localhost.csr -CA myCA.pem -CAkey myCA.key \
-CAcreateserial -out localhost.crt -days 825 -sha256 -extfile localhost.ext

-------