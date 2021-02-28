const gql = require('./graphql.js');
const yaml = require('js-yaml');

const findStep = async (context) => {
    const params = context.issue() 

    gqlrequest = `
    query getCount {
        users_progress(where: {repoName: {_eq: "${params.repo}"}, user: {_eq: "${params.owner}"}}, order_by: {startTime: desc}) {
          count
        }
      }      
    `
    // output:
    // {
    //     "data": {
    //       "users_progress": [
    //         {
    //           "count": 3
    //         }
    //       ]
    //     }
    //   }
    let result = await gql.queryData(gqlrequest)
    count = result.data.users_progress[0].count
    return count
}

const yamlFile = async (context) => {
    try {
        var yamlfile = await context.octokit.repos.getContent({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          path:".bit/config.yml",
    });
    } catch (e) {
        console.log(e)
        return
    }

    yamlfile = Buffer.from(yamlfile.data.content, 'base64').toString()

    try {
      let fileContents = yamlfile
      configyml = yaml.load(fileContents);
    } catch (e) {
      console.log("ERROR: " + e);
    }

    return configyml;
}

const getFileContent = async (context, content) => {
    const responseBody = context.issue({
        path: content,
      });
    file = await context.octokit.repos.getContent(responseBody);
    body = Buffer.from(file.data.content, 'base64').toString()
    return [file, body];
}

exports.yamlFile = yamlFile
exports.getFileContent = getFileContent
exports.findStep = findStep