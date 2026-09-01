interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium tracking-wide text-gray-600 uppercase dark:bg-gray-800/80 dark:text-gray-300">
      {text.split(' ').join('-')}
    </span>
  )
}

export default Tag
