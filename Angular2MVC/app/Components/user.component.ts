import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../Service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { IUser } from '../Model/user';
import { shoppingCart } from '../Model/shoppingCart'; //new
import { DBOperation } from '../Shared/enum';
import { Observable } from 'rxjs/Rx';
import { Global } from '../Shared/global';

import { userItem } from '../Model/userItem'; //new

@Component({
    templateUrl: 'app/Components/user.component.html'
})

export class UserComponent implements OnInit {

    @ViewChild('modal') modal: ModalComponent;
    users: IUser[];
    selectedUsers: IUser[] = [];

    user: IUser;
    currentUser: IUser; //new
    msg: string;
    indLoading: boolean = false;
    userFrm: FormGroup;
    dbops: DBOperation;
    modalTitle: string;
    modalBtnTitle: string;
    listFilter: string;
    searchTitle: "Search User";

    currentShoppingCart: shoppingCart; 



    constructor(private fb: FormBuilder, private _userService: UserService) { }

    ngOnInit(): void {
        this.userFrm = this.fb.group({
            Id: [''],
            FirstName: ['', Validators.required],
            LastName: [''],
            Gender: ['', Validators.required]
        });
        this.LoadUsers();
        this.LoadShoppingCart(); //new 
    }






    //new:
    checkboxChanged(userIdString: string) {
        var x = userId;//come here when checking a box
        var userId = parseInt(userIdString)
        for (var i = 0; i < this.selectedUsers.length; i++) {
            if (this.selectedUsers[i].Id == userId) {
                this.selectedUsers.splice(i, 1); //empty or not, if empty, 
                return;
            }
        }
        var currentSelectedUser = this.findUserById(userId);
        if (currentSelectedUser != null) {//if its not empty, add it to the end of your current product
            this.selectedUsers.push(currentSelectedUser);
        }
    }

    findUserById(userId: number) {
        for (var i = 0; i < this.users.length; i++) {
            if (this.users[i].Id == userId) {
                return this.users[i];
            }
        }

    }
//end new






    LoadUsers(): void { 
        this.indLoading = true;
        this._userService.get(Global.BASE_USER_ENDPOINT)
            .subscribe(users => { this.users = users; this.indLoading = false; },
            error => this.msg = <any>error);
    }




    LoadShoppingCart(): void { //new
        this.currentUser = JSON.parse(sessionStorage.getItem("currentUser")) //session storage expires
        var selectedUserItemList = this.convertUserListToUserItemList(this.selectedUsers);
        this.currentShoppingCart = JSON.parse(localStorage.getItem("currentShoppingCart" + this.currentUser.Id));
    }






    addUser() {
        this.dbops = DBOperation.create;
        this.SetControlsState(true);
        this.modalTitle = "Add New User";
        this.modalBtnTitle = "Add";
        this.userFrm.reset();
        this.modal.open();
    }











    purchaseItems() {
        //current user is already logged in so we retrieve currentuserid first
        //check if this user has shopping cart already
        var currentUser = JSON.parse(sessionStorage.getItem("currentUser")) //session storage expires. comes here when you hit purchase
        var selectedUserItemList = this.convertUserListToUserItemList(this.selectedUsers);
        this.currentShoppingCart = JSON.parse(localStorage.getItem("currentShoppingCart" + currentUser.Id));//checks whats in the current shopping cart, if any
        if (this.currentShoppingCart == null) { //if empty then create a new cart
            this.currentShoppingCart = new shoppingCart();
            this.currentShoppingCart.userId = currentUser.Id;
            this.currentShoppingCart.userItemList = selectedUserItemList;//new cart created
        }
        else {
            this.currentShoppingCart.userItemList = this.mergeItemList(this.currentShoppingCart.userItemList, selectedUserItemList); //if shopping cart exists, merge them and then -->
        }
        localStorage.setItem("currentShoppingCart" + currentUser.Id, JSON.stringify(this.currentShoppingCart)); //retrieve the existing files from the local storage 
    }

    convertUserListToUserItemList(selectedUsers: IUser[]) {
        var userItemList: userItem[] = [];
        for (var i = 0; i < selectedUsers.length; i++) {
            var tempUserItem = new userItem();
            tempUserItem.Quantity = 1;
            tempUserItem.user = selectedUsers[i];
            tempUserItem.Subtotal = 10.00 * tempUserItem.Quantity; //assume $10
            userItemList.push(tempUserItem);
        }
        return userItemList;
    }

    mergeItemList(existingItems: userItem[], newItemList: userItem[]) {
        var matchingFlag = false;
        for (var i = 0; i < existingItems.length; i++) {
            var currentItem = existingItems[i];
            var matchingFlag = false;

            for (var j = 0; j < newItemList.length; j++) {
                if (currentItem.user.Id == newItemList[j].user.Id) { //user will have user id
                    //new items are duplicated with existing items
                    var matchingFlag = true;
                    newItemList[j].Quantity = currentItem.Quantity + newItemList[j].Quantity
                    break;
                }
            }
        }
        //end of loop. find existing item index = i, does not match any new items
        if (!matchingFlag) { //if doesnt match, add to new item list
            newItemList.push(currentItem);
        }
        return newItemList;
    }












    editUser(id: number) {
        this.dbops = DBOperation.update;
        this.SetControlsState(true);
        this.modalTitle = "Edit User";
        this.modalBtnTitle = "Update";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    deleteUser(id: number) {
        this.dbops = DBOperation.delete;
        this.SetControlsState(false);
        this.modalTitle = "Confirm to Delete?";
        this.modalBtnTitle = "Delete";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    onSubmit(formData: any) {
        this.msg = "";

        switch (this.dbops) {
            case DBOperation.create:
                this._userService.post(Global.BASE_USER_ENDPOINT, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully added.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;
            case DBOperation.update:
                this._userService.put(Global.BASE_USER_ENDPOINT, formData._value.Id, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully updated.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;
            case DBOperation.delete:
                this._userService.delete(Global.BASE_USER_ENDPOINT, formData._value.Id).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully deleted.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;

        }
    }

    SetControlsState(isEnable: boolean) {
        isEnable ? this.userFrm.enable() : this.userFrm.disable();
    }

    criteriaChange(value: string): void {
        if (value != '[object Event]')
            this.listFilter = value;
    }

}
