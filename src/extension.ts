import * as vscode from 'vscode';

import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('bsoverlay.start', () => {
		vscode.window.showInformationMessage('Overlay started on http://localhost:31561');

		let errorCount = 0;
		let warningCount = 0;

		const someFunction = function () {
			var uri = vscode?.window?.activeTextEditor?.document.uri;
			if (uri !== undefined) {
				let diagnostics = vscode.languages.getDiagnostics(uri);
				errorCount = 0;
				warningCount = 0;

				diagnostics.forEach((error) => {
					if (error.severity > 0) {
						warningCount++;
					} else {
						errorCount++;
					}
				});
			}
		};
		setInterval(someFunction, 1000);

		const app = express();
		const server = http.createServer(app);
		const wss = new WebSocket.Server({ server });

		app.get('/', function (req, res) {
			res.send(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>BSOverlay</title>

						<meta name="viewport" content="width=device-width, initial-scale=1">

						<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
							integrity="sha512-Fo3rlrZj/k7ujTnHg4CGR2D7kSs0v4LLanw2qksYuRlEzO+tcaEPQogQ0KaoGN26/zrn20ImR1DfuLWnOo7aBA=="
							crossorigin="anonymous" referrerpolicy="no-referrer" />

						<link rel="preconnect" href="https://fonts.googleapis.com">
						<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
						<link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet">

						<style>
							* {
								font-family: 'Varela Round', sans-serif;
								font-size: 25px;
							}

							.display {
								color: #000000;
							}

							.alert-red {
								color: #9E2927;
							}

							.alert-yellow {
								color: #BE9117;
							}
						</style>

						<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
					</head>

					<body>
						<i class="fas fa-exclamation-circle alert-red"></i><span class="dislay" id="error_out">0</span>
						<i class="fas fa-exclamation-triangle alert-yellow"></i><span class="dislay" id="warning_out">0</span>

						<script>
							var ws = new WebSocket("ws://localhost:31561");

							ws.onmessage = function(event) {
								var message = JSON.parse(event.data);

								$("#error_out").text(message.errors);
								$("#warning_out").text(message.warnings);
							};

							setInterval (function () {
								ws.send("test");
							}, 1000);
						</script>
					</body>
				</html>
			`);
		});

		wss.on('connection', (ws: WebSocket) => {
			ws.on('message', (message: string) => {
				let stats = JSON.stringify({ "errors": errorCount, "warnings": warningCount });
				ws.send(stats);
			});
		});

		server.listen(process.env.PORT || 31561);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }