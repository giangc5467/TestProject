import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../Service/user.service';
import { Global } from '../Shared/global';
import { IUser } from '../Model/user';



@Component({
    template: `<img src="../../images/users.png" style="text-align:center"/>
<br/>

<div name="userNameDiv">
 <label for="username">Username</label>
 <input #username type="text" name="username" required />
</div>

<div name="passwordDiv">
 <label for="password">Password</label>
<input #password type="password" name="password" required />
</div>

<div name="buttonDiv">
<button (click)="login(username.value, password.value)" class="btn btn-primary">Login</button>
</div>

<br/>
    {{clickMessage}}`

})

export class HomeComponent implements OnInit { //"export" in angular c# means "public" function

    clickMessage = ''; //shows the output message
    users: IUser[];
    user: IUser;
    msg: string;
    indLoading: boolean = false;


    constructor(private _userService: UserService) { }

    ngOnInit(): void {
        this.LoadUsers();
    }

    login(username: string, password: string) { //this function is binded in the top @component function button

        var userNameIsFound = false; //set it to F initially so that when the username is found, you can immediately change it to true. if its true, it will run through all the elements first before u can change it
        var passwordDoesNotMatch = false;


        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].LastName == username) {
                userNameIsFound = true; //if found
                if (password == this.users[i].FirstName) {
                    this.clickMessage = "Login successful!";
                    return;
                }
                else {
                    passwordDoesNotMatch = true; //not found. incorrect pw
                }
            }
        }

        this.clickMessage = 'Login failed!';
        if (userNameIsFound)
            this.clickMessage = this.clickMessage + " Password is incorrect";
        else {
            this.clickMessage = this.clickMessage + " User not found";

        }
    }
    LoadUsers(): void {
        this.indLoading = true;
        this._userService.get(Global.BASE_USER_ENDPOINT)
            .subscribe(users => { this.users = users; this.indLoading = false; }//,
            //  error => this.msg = <any>error);
            );
    }
}
