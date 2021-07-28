import React from 'react'
import { Icon, Container, List, GridRow, Button} from 'semantic-ui-react';
import ReactTimeAgo from 'react-time-ago'

const Mailbox = (props) => {
    return (
        <Container padded>
            {props.messages ? (
                <Container>
                    <div>{props.mailbox}@{props.domain} has {props.messages.length} message(s)</div>
                    
                    <List divided relaxed>
                        {props.messages.map((msg) =>
                            <List.Item key={msg.id} >
                            <List.Icon name='mail' size='large' verticalAlign='middle' onClick=""/>
                            <List.Content>
                                <List.Header as='a' onClick={props.getMailEvent} id={msg.id} >{msg.from.value[0].name} : {msg.subject}</List.Header>
                                <List.Description as='a'><ReactTimeAgo date={msg.date} locale="en-US"/></List.Description>
                            </List.Content>
                            <List.Icon verticalAlign='middle'><Button onClick="" color='red'><Icon color='white' fitted name='trash'></Icon></Button></List.Icon>
                            </List.Item> 
                        )}
                    </List>
                </Container>
            ) : (
            <Container padded>
                <div>loading...</div>
                <div><Icon loading name='spinner' /></div>
            </Container>
            )
            }
        </Container>
    )
}
export default Mailbox;