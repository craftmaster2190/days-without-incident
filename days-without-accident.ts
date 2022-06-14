import {createCanvas} from "canvas";
import {StatusCodes} from "http-status-codes"
import moment from "moment-timezone";

const app = require('express')();
const port = process.env.PORT || 3000;

app.use((request, response, next) => {
    console.log("user-agent and ip", request.headers["user-agent"], request.headers["x-forwarded-for"] || request.ip)
    next()
})

app.get("/", (request, response) => {
    response.status(StatusCodes.OK)
        .header("Cache-Control", "max-age=" + moment.duration(10, "minute").asSeconds())
        .header("Content-Type", "text/html")
        .header('Access-Control-Allow-Origin', '*')
        .end(
            `<!DOCTYPE html>
<html lang="en">
<body>
    <h1>Days Without Incident API</h1>
    <div>
        Generates # Days Without Incident png images and opengraph links.
    </div>
    <h2>Examples:</h2>
    <div>
        <a href="/4-days-without-incident.png">4-days-without-incident.png</a><br>
        <a href="/2022-06-09-last-incident.png">2022-06-09-last-incident.png</a><br>
        <a href="/2022-06-09-last-incident-preview">2022-06-09-last-incident-preview</a><br>
        <a href="/2022-06-09-last-incident-preview?tz=America/Chicago">2022-06-09-last-incident-preview?tz=America/Chicago</a>
        <small>Defaults to America/Denver</small>
    </div>
</body>
</html>`)
})

app.get(/^\/(\d+)-days-without-incident\.png/, (request, response) => {
    const canvas = daysWithoutIncidentPngBuffer(request.params[0])

    response.status(StatusCodes.OK)
        .header("Content-Type", "image/png")
        .header("Cache-Control", "max-age=" + moment.duration(10, "minute").asSeconds())
        .header('Access-Control-Allow-Origin', '*')
        .end(canvas.toBuffer('image/png'))
})

function getDurationDays(dateString: string, timezone: string) {
    if (!timezone) {
        timezone = "America/Denver"
    }

    const today = moment().tz(timezone).startOf('day');
    const date = moment.tz(dateString, timezone);
    const duration = moment.duration(today.diff(date));
    const days = duration.asDays();
    console.log(
        "timezone=" + timezone,
        "today=" + today.format(),
        "date=" + date.format(),
        "duration=" + duration.toISOString(),
        "days=" + days)
    return Math.floor(days);
}

app.get(/^\/(\d{4}-\d{2}-\d{2})-last-incident\.png/, (request, response) => {
    const canvas = daysWithoutIncidentPngBuffer(getDurationDays(request.params[0], request.query["tz"]))

    response.status(StatusCodes.OK)
        .header("Content-Type", "image/png")
        .header("Cache-Control", "max-age=" + moment.duration(10, "minute").asSeconds())
        .header('Access-Control-Allow-Origin', '*')
        .end(canvas.toBuffer('image/png'), 'binary')
})

app.get(/^\/(\d{4}-\d{2}-\d{2})-last-incident-preview\/?/, (request, response) => {
    const durationDays = getDurationDays(request.params[0], request.query["tz"]);

    const timezoneQueryString = request.query['tz'] ? `?tz=${request.query['tz']}` : ""

    response.status(StatusCodes.OK)
        .header("Cache-Control", "max-age=" + moment.duration(10, "minute").asSeconds())
        .header("Content-Type", "text/html")
        .end(
            `<!DOCTYPE html>
<html lang="en">
<head>
    <title>${durationDays} Days Without Incident</title>
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://days-since-incident.herokuapp.com/${request.params[0]}-last-incident-preview${timezoneQueryString}">
    <meta property="og:title" content="${durationDays} Days Without Incident">
    <meta property="og:description" content="${durationDays} Days Without Incident">
    <meta property="og:image" content="https://days-since-incident.herokuapp.com/${request.params[0]}-last-incident.png${timezoneQueryString}">
</head>
<body>
    <a href="/">Home</a><br>
    <img src="/${request.params[0]}-last-incident.png${timezoneQueryString}" 
         alt="${durationDays} Days Without Incident">
</body>
</html>`)
})

function daysWithoutIncidentPngBuffer(days: number) {
    const width = 600
    const height = 400

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    const margin = 10

    // Big rectangle
    context.fillStyle = '#FFFFFF'
    roundRect(context, margin, margin, width - (margin * 2), height - (margin * 2), 50, true);
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
