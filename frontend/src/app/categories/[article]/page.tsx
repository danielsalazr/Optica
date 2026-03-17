import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min';

interface ArticleProps {
    params: Promise<{
        article: string,
    }>
}

async function Article(props: ArticleProps) {
    const { article } = await props.params
  return (
    <div>
      {article}
    </div>
  )
}

export default Article
