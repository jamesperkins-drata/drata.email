import React from 'react';
import { Message } from 'semantic-ui-react'

function RefreshNotice (props) {
const [visible, setVisible] = React.useState(true)

  const handleDismiss = () => {
    setVisible(false)
  }

    if (props.visible && visible) {
      return (
        <Message
          className="brandColor"
          onDismiss={handleDismiss}
          header='Automatic Refresh'
          content='Your mailbox will automatically refresh when a new mail is recieved for the account you have open.'
        />
      )
    }
    else{
        return ('')
    }
}

export default RefreshNotice