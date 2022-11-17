const { filter, map, scan } = rxjs.operators;
const { fromEvent, merge } = rxjs;
// DODGINESS ENDS HERE
const RADIUS = 10;
const drawCircle = (context, circle) => {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    context.fillStyle = 'black';
    context.fill();
};
const main = () => {
    const canvas = document.querySelector('#canvas');
    const context = canvas.getContext('2d');
    if (canvas)
        canvas.width = window.innerWidth, canvas.height = window.innerHeight;
    const $mousePos = fromEvent(canvas, 'mousemove').pipe(map(ev => {
        const x = ev.clientX, y = ev.clientY;
        const { top, left } = canvas.getBoundingClientRect();
        return { x, y };
    }));
    const $mouseDown = merge(fromEvent(canvas, 'mousedown').pipe(map(() => ({ mouseDown: true }))), fromEvent(canvas, 'mouseup').pipe(map(() => ({ mouseDown: false }))));
    const $mouseState = merge($mouseDown, $mousePos).pipe(scan((acc, val) => (Object.assign(Object.assign({}, acc), val)), { x: 0, y: 0, mouseDown: false }));
    const $userCircles = $mouseState.pipe(filter((state) => state.mouseDown), map((state) => ({ x: state.x, y: state.y, radius: RADIUS })));
    $userCircles.subscribe(circle => socket.send(JSON.stringify(circle)));
    const socket = new WebSocket('ws://localhost:8080');
    const $socketCircles = fromEvent(socket, 'message').pipe(map(ev => ev.data), map(data => {
        console.log('here');
        console.log(data);
        console.log(data.toString());
        return JSON.parse(data.toString());
    }));
    const $circles = merge($userCircles, $socketCircles).subscribe(circle => window.requestAnimationFrame(() => drawCircle(context, circle)));
};
main();
