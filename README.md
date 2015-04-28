# loopback-connector-orchestrate
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

LoopBack connector for [Orchestrate](http://orchestrate.io)

### Installation

In your LoopBack project:
    
    $ npm install loopback-connector-orchestrate

## Using the Connector
To use the connector, define the datasource using the connector in your `datasources.json` file:
    
    "orchestrate": {
        "name": "orchestrate",
        "connector": "loopback-connector-orchestrate",
        "authToken": "YOUR_ORCHESTRATE_AUTH_TOKEN"
    }
  
Next, attach the created datasource to a model in the `model-config.json` file:

    "orchestrate": {
        "dataSource": "orchestrate",
        "public": true
    }

### Custom Endpoints (e.g Using EU West)
the datasource definition in `datasources.json` supports an (optional) endpoint key. **You must define your endpoint if you use a server other than US East**

EU West example:

```json 
    "orchestrate": {
        "name": "orchestrate",
        "connector": "loopback-connector-orchestrate",
        "authToken": "YOUR_ORCHESTRATE_AUTH_TOKEN", 
        "endpoint": "https://api.aws-eu-west-1.orchestrate.io/"
    }
```

<!-- Now, using the created model, you can send an SMS or make a call using the `send` method of the model:
    
    orchestrate.send(options, callback);
    
**Note**: `options` is defined by the JSON objects in the next two sections:

### Sending a SMS
    {
        type: 'sms',
        to: 'YOUR_ORCHESTRATE_PHONE_NUMBER',
        from: 'TARGET_PHONE_NUMBER',
        body: 'TEXT_MESSAGE'
    }

### Making a Call
    {
        type: 'call',
        to: 'YOUR_ORCHESTRATE_PHONE_NUMBER',
        from: 'TARGET_PHONE_NUMBER',
        url: 'URL_TO_TwiMIL_FILE'
    }
    
## Running the Example
To run the example in the `/example/example.js` directory, you must set the following values in the file:

    var SID = 'YOUR_ORCHESTRATE_ACCOUNT_SID';
    var TOKEN = 'YOUR_ORCHESTRATE_ACCOUNT_TOKEN';
    var TO = 'YOUR_ORCHESTRATE_TELEPHONE_NUMBER';
    var FROM = 'TARGET_PHONE_NUMBER';

Next, from the from the `/loopback-connector-orchestrate/` directory, install the `loopback` module using the following command:
    
    $ npm install loopback
    
Finally, run the example app using the following command from the `/loopback-connector-orchestrate/` directory:

    $ node ./example/example.js
    
**NOTE**: The `url` property points to an XML file that specifies a [TwiMIL](http://www.orchestrate.com/docs/api/twiml) command.
 -->
