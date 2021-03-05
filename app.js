/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const newrelic = require('newrelic');

const data = require('./functions/data.js');
const steps = require('./functions/steps.js');

var start;

module.exports = (app) => {
 app.log.info("Yay, the app was loaded!");
 app.on("push", async (context) => {
  try {
    start = context.payload.commits[0].added[0].substring(0,4)
  } catch (e) {
    start = ""
  }

  if (start == ".bit") {
    let configData = await data.yamlFile(context);
    steps.startLab(context, configData);
  }
 });

 app.on('pull_request.closed', async (context) => {
  console.log("Pull request")
  main(context, 'pull_request.closed');
 });

 app.on('issue_comment.created', async (context) => {
  console.log("Issue comment created")
  if (context.payload.sender.login != "bitcampdev[bot]") {
    main(context, 'issue_comment.created');
  }
 });

 app.on('workflow_run.completed', async (context) => {
   console.log("Workflow run")
   console.log(context.payload.workflow_run.name)
   if (context.payload.workflow_run.name != "Syncing Your Cabin") {
      main(context, 'workflow_run.completed');
   }
 });
};

async function main(context, event) {
  let configData = await data.yamlFile(context);
  console.log("Got configyml!")
  let currentStep = await data.findStep(context);
  console.log("Getting current step!")
  let typeOfStep = data.typeStep(currentStep, configData, event);
  console.log("The type: " + typeOfStep)
  let moveOn = steps.workEvaluation(typeOfStep, context, configData);
  console.log("Successfully evaluated" + moveOn)
  console.log("Next Step function executing")
  console.log("Context: " + context)
  steps.nextStep(moveOn, currentStep, context, configData);
}