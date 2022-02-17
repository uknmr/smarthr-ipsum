import 'dotenv/config'
import fetch from 'node-fetch'
import fs from 'fs/promises'

import { extractSentences } from './extractSentences.mjs'

const baseURL = 'https://api.github.com'
const TARGETS = process.env.TARGETS.split(',')
const exclusionWords = ['test', 'stories']
const excludeWordsRegExp = new RegExp(`^(?!.*(${exclusionWords.join('|')})).*$`)
const headers = {
  Authorization: `token ${process.env.TOKEN_GITHUB}`,
}

const main = async () => {
  const repositories = await extractRepositories()
  const fileList = await getFileList(repositories)

  const sentences = await Promise.all(
    fileList.map(async ({ repository, files }) => {
      const contents = await Promise.all(
        files.map(
          async ({ path }) =>
            await getContent(repository, path).catch((e) => {
              console.log(repository, path)
              console.trace(e)
            }),
        ),
      )
      const sentenceList = contents
        .map((content) => extractSentences(content))
        .flat()

      return Array.from(new Set(sentenceList))
    }),
  )

  await fs.writeFile(
    'sentences.json',
    JSON.stringify(Array.from(new Set(sentences.flat())), null, '\t'),
  )
}

const extractRepositories = async () => {
  // 直近更新されている上位100件
  const uri = `${baseURL}/orgs/kufu/repos?sort=updated&per_page=100`
  const res = await fetch(uri, { headers })
  const repositories = await res.json()

  return repositories
    .filter(({ name }) => TARGETS.includes(name))
    .map(({ name, default_branch }) => {
      return {
        name,
        defaultBranch: default_branch,
      }
    })
}

const getFileList = async (repositories) =>
  Promise.all(
    repositories.map(async ({ name, defaultBranch }) => {
      const tree = await getFileTree(name, defaultBranch)
      const files = extractTargetFiles(tree)
      console.log(name, files.length)

      return {
        repository: name,
        files,
      }
    }),
  )

const getFileTree = async (repository, defaultBranch) => {
  const uri = `https://api.github.com/repos/kufu/${repository}/git/trees/${defaultBranch}?recursive=1`
  const res = await fetch(uri, { headers })
  const { tree } = await res.json()

  return tree
}

const getContent = async (repository, path) => {
  const uri = `https://api.github.com/repos/kufu/${repository}/contents/${path}`
  const res = await fetch(uri, {
    headers: { ...headers },
  })
  const { content } = await res.json()

  return Buffer.from(content, 'base64').toString()
}

const extractTargetFiles = (tree) => {
  return tree
    .filter(({ path }) => /^.*\.tsx$/.test(path))
    .filter(({ path }) => excludeWordsRegExp.test(path))
}

try {
  main()
} catch (e) {
  console.trace(e)
  process.exitCode = 1
}
