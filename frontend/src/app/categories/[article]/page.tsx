import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min';

interface ArticleProps {
    params: {
        article: string,
    }
}

function Article(props: ArticleProps) {
    console.log(props)
    const { article } = props.params
  return (
    <div>
      sas sas sas sisas
    </div>
  )
}

export default Article
