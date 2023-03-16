export { };
import { User } from '../../api/models';

const USER_1 = {
  email: 'user1@example.com',
  role: 'user',
  password: 'user111'
};

async function setup() {

  const user1 = new User(USER_1);
  await user1.save();

}

async function checkNewDB() {
  const user1 = await User.findOne({ email: USER_1.email });
  if (!user1) {
    console.log('- New DB detected ===> Initializing Dev Data...');
    await setup();
  } else {
    console.log('- Skip InitData');
  }
}

checkNewDB();
