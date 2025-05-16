import React from 'react';
import { Switch, Route } from 'react-router-dom';
import UserList from './UserList';
import UserActivityLog from './UserActivityLog';

const UserManagement: React.FC = () => {
  return (
    <Switch>
      <Route exact path="/user-management" component={UserList} />
      <Route path="/user-management/activity/:userId" component={UserActivityLog} />
    </Switch>
  );
};

export default UserManagement;
