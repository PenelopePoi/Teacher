const vscode = require('vscode');

/**
 * Teacher Welcome Extension
 * Registers commands for the Getting Started walkthrough steps.
 */
function activate(context) {
    // Register all walkthrough commands
    const commands = [
        {
            id: 'teacher.openDashboard',
            handler: () => {
                vscode.commands.executeCommand('workbench.action.openWalkthrough', 'teacher-ide.teacher-welcome-ext#teacher.welcome');
                vscode.window.showInformationMessage('Welcome to Teacher IDE! Your learning dashboard is ready.');
            }
        },
        {
            id: 'teacher.startTutor',
            handler: () => {
                // Attempt to focus the Teacher tutor view if available
                vscode.commands.executeCommand('teacher-tutor.focus').then(undefined, () => {
                    vscode.window.showInformationMessage('Teacher Tutor: Your AI tutor is ready to help. Ask any coding question!');
                });
            }
        },
        {
            id: 'teacher.browseLessons',
            handler: () => {
                vscode.commands.executeCommand('teacher-curriculum.focus').then(undefined, () => {
                    vscode.window.showInformationMessage('Teacher Lessons: Browse the curriculum to find your next lesson.');
                });
            }
        },
        {
            id: 'teacher.runAssessment',
            handler: () => {
                vscode.commands.executeCommand('teacher-assessment.focus').then(undefined, () => {
                    vscode.window.showInformationMessage('Teacher Assessment: Open a lesson file, then run an assessment to check your work.');
                });
            }
        },
        {
            id: 'teacher.viewProgress',
            handler: () => {
                vscode.commands.executeCommand('teacher-progress.focus').then(undefined, () => {
                    vscode.window.showInformationMessage('Teacher Progress: Track your completed lessons, scores, and skill growth.');
                });
            }
        }
    ];

    for (const cmd of commands) {
        const disposable = vscode.commands.registerCommand(cmd.id, cmd.handler);
        context.subscriptions.push(disposable);
    }

    console.log('Teacher Welcome extension activated');
}

function deactivate() {}

module.exports = { activate, deactivate };
