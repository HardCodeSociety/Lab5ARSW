var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    var canvasPath = "/topic/newpoint";
    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
        var message = {x:point.x,y:point.y};
        stompClient.send(canvasPath, {}, JSON.stringify(message));       
        
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSuscribeById = function (index){
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);       
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            canvasPath = '/app/newpoint.'+index;
            stompClient.subscribe('/topic/newpoint.'+index, function (eventbody) {
                var theObject=JSON.parse(eventbody.body);
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.beginPath();
                ctx.arc(theObject.x, theObject.y, 3, 0, 2 * Math.PI);
                ctx.stroke();
                
            });
            
            stompClient.subscribe('/topic/newpolygon.'+index , function (points) {   
                var polygonJS = JSON.parse(points.body);
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.fillStyle = '#26C8ED';
                ctx.beginPath();
                ctx.moveTo(polygonJS[0].x, polygonJS[0].y);
                for (i = 1; i < polygonJS.length; i++) {
                    ctx.lineTo(polygonJS[i].x, polygonJS[i].y);
                }
                ctx.closePath();
                ctx.stroke();
            });
        });

        
    };
    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);       
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', function (eventbody) {
                var theObject=JSON.parse(eventbody.body);
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.beginPath();
                ctx.arc(theObject.x, theObject.y, 3, 0, 2 * Math.PI);
                ctx.stroke();
                
            });
        });

    };
    
    

    return {

        init: function () {
            var canVal = document.getElementById("canvas");
            canVal.addEventListener('click', function(event){
                var ident = document.getElementById("ident").value;
                stompClient.send("/app/newpoint."+ident, {}, JSON.stringify(new Point(getMousePosition(event).x,getMousePosition(event).y)));
            });
            connectAndSubscribe();
        },
        connectAndSusById: function(index){
              var can = document.getElementById("canvas");
              connectAndSuscribeById(index);
        },
        

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            var ident = document.getElementById("ident").value;
            stompClient.send("/topic/newpoint."+ident, {}, JSON.stringify(pt)); 
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();