const data = require('./data.js');
const gql = require('./graphql.js')

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
