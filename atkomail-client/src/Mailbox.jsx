import React from 'react'
import { Icon, Input, Button, List} from 'semantic-ui-react';
import ReactTimeAgo from 'react-time-ago'

const Mailbox = (props) => {
    return (
        <div>
            {props.messages ? (
            <div>
            <p>{props.mailbox} has {props.messages.length} message(s)</p>
                <List divided relaxed>
                    {props.messages.map((msg) =>
                        <List.Item key={msg.id} >
                        <List.Icon name='mail' size='large' verticalAlign='middle' />
                        <List.Content>
                        <List.Header as='a' onClick={props.getMailEvent} id={msg.id} >{msg.from.value[0].name} : {msg.subject}</List.Header>
                            <List.Description as='a'><ReactTimeAgo date={msg.date} locale="en-US"/></List.Description>
                        </List.Content>
                        </List.Item> 
                    )}
                </List>
            </div>) : (
            <div>
                <div>loading</div>
                <div><Icon loading name='spinner' /></div>
            </div>
            )
            }
        </div>
    )
}
export default Mailbox;