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
  master(context);
 });

 app.on('issue_comment.created', async (context) => {
  master(context);
 });
 app.on('workflow_run', async (context) => {
  master(context);
 });
};

async function master(context) {
  let configData = await data.yamlFile(context);
  let currentStep = await data.findStep(context);
  console.log(currentStep)
  // let typeOfStep = data.typeStep(currentStep, configData);
  // let moveOn = data.workEvaluation(typeOfStep);
  // steps.nextStep(context, currentStep, moveOn);
}