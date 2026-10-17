import { useParams } from 'react-router-dom'

export default function EventDetails() {
  const { id } = useParams()

  return (
    <>
      <h1>Event Details</h1>
      <p>Event ID: {id}</p>
    </>
  )
}
