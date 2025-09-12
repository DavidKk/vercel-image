export interface ContainerProps {
  noStyle?: boolean
  children: React.ReactNode
}

export default function Container(props: ContainerProps) {
  const { noStyle, children } = props

  if (noStyle) {
    return children
  }

  return <div className="flex flex-1 border rounded-md overflow-hidden">{children}</div>
}
