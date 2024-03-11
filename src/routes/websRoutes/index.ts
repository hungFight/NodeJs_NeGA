import jwtAuth from '../../middleware/jwtAuth';
import express from 'express';
import postRoute from './socialNetwork/post';
import searchRoute from './socialNetwork/searchRouterSN';
import userRoute from './user';
import peopleRoute from './socialNetwork/people';
import messenger from './messenger';
import fileGridFS from './fileGridFS';
import errorHandler from '../../middleware/errorHandles';
function routeSN(app: any) {
    console.log('erararea');
    app.use('/api/v1/user', userRoute);
    app.use('/api/v1/SN/home/post', postRoute);
    app.use('/api/v1/SN/profile', searchRoute);
    app.use('/api/v1/SN/people', peopleRoute);
    app.use('/api/v1/messenger', messenger);
    app.use('/api/v1/fileGridFS', fileGridFS);
}
export default routeSN;
