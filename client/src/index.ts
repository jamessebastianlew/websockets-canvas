// DO NOT TOUCH OR ADD SPACE, THIS LOOKS DODGY BUT ITS FOR GOOD REASON
import a from 'rxjs';
import b from 'rxjs/operators';
const rxjs = { ...a, operators: b };
const { filter, map, scan } = rxjs.operators;
const { fromEvent, merge } = rxjs;
// DODGINESS ENDS HERE

const RADIUS = 10;

type Circle = { x: number, y: number, radius: number };
type Context = CanvasRenderingContext2D;
type Canvas = HTMLCanvasElement;
type MousePos = { x: number, y: number };
type MouseDown = { mouseDown: boolean };
type MouseState = MousePos & MouseDown;

const drawCircle = (context: CanvasRenderingContext2D, circle: Circle) => {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    context.fillStyle = 'black';
    context.fill();
}

const main = () => {
    const canvas = document.querySelector('#canvas') as Canvas;
    const context = canvas.getContext('2d') as Context;

    if (canvas) canvas.width = window.innerWidth, canvas.height = window.innerHeight;


    const $mousePos = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(
        map<MouseEvent, MousePos>(
            ev => {
                const x = ev.clientX, y = ev.clientY;
                const { top, left } = canvas.getBoundingClientRect();
                return { x, y };
            }
        )
    );

    const $mouseDown = merge(
        fromEvent<MouseEvent>(canvas, 'mousedown').pipe(map<MouseEvent, MouseDown>(() => ({ mouseDown: true }))),
        fromEvent<MouseEvent>(canvas, 'mouseup').pipe(map<MouseEvent, MouseDown>(() => ({ mouseDown: false })))
    );

    const $mouseState = merge($mouseDown, $mousePos).pipe(
        scan<MouseDown | MousePos, MouseState>(
            (acc: MouseState, val: MouseDown | MousePos) => ({ ...acc, ...val }),
            { x: 0, y: 0, mouseDown: false }
        )
    );

    const $userCircles = $mouseState.pipe(
        filter((state: MouseState) => state.mouseDown),
        map<MouseState, Circle>((state: MouseState) => ({ x: state.x, y: state.y, radius: RADIUS }))
    );

    $userCircles.subscribe(circle => socket.send(JSON.stringify(circle)));

    const socket = new WebSocket('ws://localhost:8080');
    const $socketCircles = fromEvent(socket, 'message').pipe(
        map<any, Blob>(ev => ev.data),
        map<Blob, Circle>(data => {
            console.log('here')
            console.log(data)
            console.log(data.toString())
            return JSON.parse(data.toString())
        })
    );

    const $circles = merge($userCircles, $socketCircles).subscribe(circle => window.requestAnimationFrame(() => drawCircle(context, circle)))
}

main();