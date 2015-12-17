ตรวจสอบ Version  เปิด Command-line Interface 
node -v

1. ติดตั้ง gulp.js
อย่างแรกเลยให้เราติดตั้ง gulp.js ก่อน โดยการติดตั้งนั้น เราจะต้องทำอยู่ 2 ที่ด้วยกัน ดังนี้
1.1 Global การติดตั้งที่ global นี้ เป็นการทำให้เราสามารถใช้คำสั่งของ gulp.js ใน command-line ได้ โดยเราจะทำเพียงแค่ครั้งเดียวเท่านั้น (งานหน้าไม่ต้องติดตั้งแบบนี้แล้ว) ให้เราพิมพ์คำสั่งด้านล่างนี้
npm install -g gulp

1.2 Local  ต่อมาเราจะต้องติดตั้ง gulp.js แบบ local ด้วย ซึ่งก็คือการติดตั้ง gulp.js เอาไว้ที่ folder งานของเรานั่นเอง ให้เรา cd เข้าไปที่ folder งานของเราก่อน
npm install --save-dev gulp
npm install --save-dev gulp-jade
npm install --save-dev gulp-jshint
npm install --save-dev gulp-watch
npm install --save-dev gulp-csslint

วิธีใช้ npm เปิด Command-line Interface ขึ้นมา แล้วเข้าไปยัง path ที่ต้องการจะติดตั้ง(ที่อยู่ของ project เรา) จากนั้นให้พิมพ์คำสั่งนี้
npm install
npm install - g bower
bower install

สั่งให้ gulp ทำงาน
gulp

ติดตั้ง npm install nodewebkit
สั่งทำงาน

nw.js
nw .
