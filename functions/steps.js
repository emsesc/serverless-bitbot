const data = require('./data.js');
const gql = require('./graphql.js');
const eval = require('./eval.js')

const nextStep = async (moveOn, count, context, configyml, issueno, countfile) => {

  // update count, update hasura and local file
  if (moveOn[0] == true) {
    for (y = 0; y < configyml.steps[count].actions.length; y++) {
      var array = configyml.steps[count].actions[y]
     console.log("Responding")
     // Executes an action based on the step in the YAML
      if (array.type == "respond") {
        const response = await data.getFileContent(context, `.bit/responses/${array.with}`)
        const issueComment = context.issue({
          body: response[1],
          issue_number: issueno,
        });
        context.octokit.issues.createComment(issueComment)
      }

      if (array.type == "createIssue") {
        const response = await data.getFileContent(context, `.bit/responses/${array.body}`)
        const issueBody = context.issue({
          title: array.title,
          body: response[1],
        });

        context.octokit.issues.create(issueBody)
      } 

      if (array.type == "closeIssue") {
        const payload = context.issue({
          state: "closed",
          issue_number: issueno,
        })
  
        context.octokit.issues.update(payload)
      }
    }
  }

  console.log("Incrementing count")
  console.log(count)
  count += 1
  console.log(count)
  const update = context.issue({
    path: ".bit/.progress",
    message: "Update progress",
    content: Buffer.from(count.toString()).toString('base64'),
    sha: countfile[0].data.sha,
    committer: {
      name: `bitcampdev`,
      email: "info@bitproject.org",
    },
    author: {
      name: `bitcampdev`,
      email: "info@bitproject.org",
    },
  });
  console.log("Attempting to update...")
  await context.octokit.repos.createOrUpdateFileContents(update)
  console.log("Successfully updated!")

  var path = `.bit/responses/${configyml.steps[count-1].actions[0].with}`
  var gqlrequest = `
  mutation insertProgress {
   insert_users_progress(
     objects: {
       link: "${moveOn[1]}", 
       path: "${path}", 
       repo: "${moveOn[2]}", 
       title: "${configyml.steps[count].title}", 
       user: "${moveOn[3]}",
       count: ${count},
       repoName: "${moveOn[4]}",
     }
   ) {
     returning {
       id
     }
   }
 }
 `
 console.log(await gql.queryData(gqlrequest))
}

const workEvaluation = async (typeOfStep, context, configyml) => {
  var res = []
  if (typeOfStep[0] == "checks") {
    console.log("Checking checks")
    res = await eval.checks(context)
  } else if (typeOfStep[0] == "IssueComment") {
    console.log("Checking comment")
    res = await eval.IssueComment(context)
  } else if (typeOfStep[0] == "PRmerge") {
    console.log("Checking PR")
    res = await eval.PRmerge(context, configyml)
  }
  return res
}

const startLab = async (context, configyml) => {
    // var gqlrequest = `
    // mutation startCourse {
    // insert_course_analytics(
    //     objects: {
    //     repo: "${context.payload.repository.html_url}", 
    //     user: "${context.payload.repository.owner.login}"
    // }) {
    //     returning {
    //     id
    //     }
    // }
    // }
    // `
    // console.log(await gql.queryData(gqlrequest))

    try {
        await context.octokit.repos.createOrUpdateFileContents({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          path: ".bit/.progress",
          message: "Track progress",
          content: Buffer.from(JSON.stringify(0)).toString('base64'),
          committer: {
            name: `bitcampdev`,
            email: "info@bitproject.org",
          },
          author: {
            name: `bitcampdev`,
            email: "info@bitproject.org",
          },
        })
      } catch (e) {
        return
      }
    
    var path = `.bit/responses/${configyml.before[0].body}`
    var gqlrequest = `
    mutation insertProgress {
        insert_users_progress(
        objects: {
            path: "${path}", 
            repo: "${context.payload.repository.html_url}", 
            title: "${configyml.steps[0].title}", 
            user: "${context.payload.repository.owner.login}",
            count: 0,
            repoName: "${context.payload.repository.name}"
        }
        ) {
        returning {
            id
        }
        }
    }
    `
    console.log(await gql.queryData(gqlrequest))

    console.log("Templated created...")
    console.log("Attempting to get YAML")

    // start lab by executing what is in the before portion of config.yml
    let response = await context.octokit.repos.getContent({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        path: path,
    });

    response = Buffer.from(response.data.content, 'base64').toString()
    return await context.octokit.issues.create({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      title: configyml.before[0].title,
      body: response,
    })
}

exports.startLab = startLab
exports.workEvaluation = workEvaluation
exports.nextStep = nextStep
