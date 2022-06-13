import {createCanvas} from "canvas";
import {StatusCodes} from "http-status-codes"
import moment from "moment";

const app = require('express')();
const port = process.env.PORT || 3000;

app.get(/^\/(\d+)-days-without-incident\.png/, (request, response) => {
    const canvas = daysWithoutIncidentPngBuffer(request.params[0])

    response.status(StatusCodes.CREATED)
        .header("Content-Type", "image/png")
        .end(canvas.toBuffer('image/png'))
})

app.get(/^\/(\d{4}-\d{2}-\d{2})-last-incident\.png/, (request, response) => {
    const date = moment(request.params[0])
    console.log("date=" + date.format())

    const duration = moment.duration(moment().diff(date))
    let durationDays = Math.floor(duration.asDays());
    console.log("duration=" + duration + " days= " + durationDays)

    const canvas = daysWithoutIncidentPngBuffer(durationDays)

    response.status(StatusCodes.CREATED)
        .header("Content-Type", "image/png")
        .header("Cache-Control", "max-age=" + moment.duration(10, "minute").asSeconds())
        .end(canvas.toBuffer('image/png'))
})

function daysWithoutIncidentPngBuffer(days: number) {
    const width = 600
    const height = 400

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    const margin = 10

    // Big rectangle
    roundRect(context, margin, margin, width - (margin * 2), height - (margin * 2), 50);

    const daysCenterX = width * (1 / 3)
    const daysCenterY = height * (1 / 3) + 15;
    const daysBoxWidth = days >= 10 ? 220 : 120
    const daysBoxHeight = 100

    roundRect(context, daysCenterX - (daysBoxWidth / 2), daysCenterY - 30 - (daysBoxHeight / 2), daysBoxWidth, daysBoxHeight);
    context.font = 'bold 70pt Menlo'
    context.textAlign = 'center'
    context.fillStyle = '#FF0000'
    context.fillText(String(days), daysCenterX, daysCenterY)

    context.font = 'bold 40pt Menlo'
    context.fillStyle = '#000000'
    context.fillText("days", width * (2 / 3), height * (1 / 3))
    context.fillText("without incident", width * (1 / 2), height * (3 / 4))

    return canvas;
}

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius: number | Record<'tl' | 'tr' | 'br' | 'bl', number> = 5,
    fill = false,
    stroke = true
) {
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        radius = {...{tl: 0, tr: 0, br: 0, bl: 0}, ...radius};
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

app.listen(port, () => {
    console.log(`application is running on port ${port}.`);
});
