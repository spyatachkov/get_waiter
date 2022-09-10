
const express = require('express'); 
const path = require('path');
const WebSocket = require('ws');
const constants = require('./constants');

const wsServer = new WebSocket.Server({ port: 9000 });

const app = express(); 
const port = 3000; 

app.set('view engine', 'hbs'); 
app.use(express.static(path.join(__dirname)));

app.listen(port, () => { 
    console.log('server start') 
}) 

app.get('/table/:tableId', function (req, res) { 
    res.render('index.hbs', {
        tableId: req.params.tableId, 
    }); 
}); 

app.get('/table/get_waiter/:tableId', function (req, res) {
    const message = `Cтолик ${req.params.tableId} хочет офика`;
    const hrefPath = `${constants.serverURL}/table/${req.params.tableId}`;
    broadcastMessage(message) // отправил в админку мессадж
    res.render('success.hbs', {
        tableId: req.params.tableId,
        hrefPath: hrefPath,
    })
})


app.get('/admin', function (req, res) {
    res.render('admin.hbs', {
    }); 
});


let wsClients = new Map()

wsServer.on('connection', onConnect);

function onConnect(wsClient) {
    console.log('Новый пользователь');
    wsClient.send('Привет');
    
    wsClients.set(wsClient)

    wsClient.on('close', function() {
        console.log('Пользователь отключился');
    });

    wsClient.on('message', function(message) {
        console.log(message);
        
        try {
            const jsonMessage = JSON.parse(message);
            switch (jsonMessage.action) {
                case 'ECHO':
                    wsClient.send(jsonMessage.data);
                    break;
                case 'PING':
                    setTimeout(function() {
                        wsClient.send('PONG');
                    }, 2000);
                    break;
                default:
                    console.log('Неизвестная команда');
                    break;
            }
        } catch (error) {
            console.log('Ошибка', error);
        }
    });
}



function broadcastMessage(message) {
    wsServer.clients.forEach(client => {
        client.send(JSON.stringify(message))
    })
}