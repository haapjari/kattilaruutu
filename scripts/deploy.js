const ora = require('ora')
const fs = require('fs').promises
const {exec} = require('child_process')

// deployment stuff
const PROJECT_NAME = 'linkki-link'
const ENV = 'dev'
const STACK_NAME = `${PROJECT_NAME}-${ENV}`
const SOURCE_BUCKET = `${PROJECT_NAME}-source-${ENV}`
const WEBAPP_BUCKET = `${PROJECT_NAME}-app-${ENV}`

// directories
const LAMBDA_DIR = './src/lambda'
const LAMBDA_BUILD_DIR = './build'
const WEBAPP_DIR = './src/webapp'
const WEBAPP_BUILD_DIR = './src/webapp/build'

// template filenames
const TEMPLATE_IN = './cf-template.yaml'
const TEMPLATE_OUT = './cf-template_out.yaml'
const TEMPLATE_PKG = './packaged-template.json'

const deploy = async () => {
  const steps = [
    step(
      'Building lambdas...',
      buildLambdas,
      LAMBDA_DIR
    ),
    step(
      'Building webapp...',
      buildWebapp,
      WEBAPP_DIR
    ),
    step(
      'Building CloudFormation template...',
      buildTemplate,
      TEMPLATE_IN, TEMPLATE_OUT
    ),
    step(
      'Packaging CloudFormation template...',
      packageTemplate,
      TEMPLATE_OUT, TEMPLATE_PKG, SOURCE_BUCKET
    ),
    step(
      'Deploying CloudFormation template...',
      deployTemplate,
      TEMPLATE_PKG, STACK_NAME, { Env: ENV }
    ),
    step(
      'Deploying webapp...',
      syncWebApp,
      WEBAPP_BUILD_DIR, WEBAPP_BUCKET
    ),
  ]
  await runSteps(steps)
}

const buildLambdas = async (dir) => {
  await fs.mkdir(LAMBDA_BUILD_DIR)
  const lms = await fs.readdir(dir)
  return Promise.all(lms.map(lm =>
    run(`cfbuild lambda -d "${dir}/${lm}" -o "${LAMBDA_BUILD_DIR}/${lm}.zip"`)
  ))
}

const buildWebapp = async (dir) => {
  await run('npm ci', dir)
  return run('npm run build', dir)
}

const buildTemplate = async (cfin, cfout) =>
  run(`cfbuild template -t "${cfin}" -o "${cfout}"`)

const packageTemplate = async (cfin, cfout, srcBucket) =>
  run(`
    aws cloudformation package \
      --s3-bucket "${srcBucket}" \
      --use-json \
      --template-file "${cfin}" \
      --output-template-file "${cfout}"
  `)

const deployTemplate = async (cfin, stackname, params) =>
  run(`
    aws cloudformation deploy \
      --template-file="${cfin}" \
      --stack-name="${stackname}" \
      --parameter-overrides ${serializeParameters(params)} \
      --capabilities CAPABILITY_IAM
  `)

const syncWebApp = async (dir, bucket) => {
  await run(`aws s3 sync "${dir}" "s3://${bucket}" --acl public-read`)
  // disable caching for index.html
  return run(`aws s3 cp \
    "${dir}/index.html" \
    "s3://${bucket}/index.html" \
    --metadata-directive REPLACE \
    --cache-control 'public, no-cache, must-revalidate, proxy-revalidate, max-age=0' \
    --acl public-read
  `)
}

const serializeParameters = (params) =>
  Object.keys(params)
    .map(k => `"${k}=${params[k]}"`)
    .join(' ')

const run = async (cmd, cwd='./') => {
  return new Promise((res, rej) => {
    exec(cmd, {cwd}, (err, stdout, stderr) => {
      return err
        ? rej(stderr)
        : res(stdout)
    })
  })
}

const step = (msg, fun, ...args) => ({
  message: msg,
  run: () => fun(...args)
})

const runSteps = async (steps) => {
  const p = steps.reduce((acc, cur) => {
    return acc.then(() => {
      const p = cur.run()
      ora.promise(p, {
        text: cur.message,
        spinner: 'dots12',
        color: 'blue'
      })
      return p
    })
  }, Promise.resolve()).catch(console.error)
  await p
}

deploy()
