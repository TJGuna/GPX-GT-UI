import {Component, OnInit, Input, isDevMode, Output, EventEmitter, ViewEncapsulation, ElementRef} from '@angular/core';
//import { formatDate } from "@angular/common";
import { Router } from "@angular/router";
import {PostService} from '../../../services/post.service';
import {UserService} from '../../../services/user.service';
import {DatashareService} from '../../../services/datashare.service';
import {Post} from '../../../models/post';

import {DomSanitizer} from "@angular/platform-browser";

@Component({
    selector: 'app-postcard',
    templateUrl: './postcard.component.html',
    styleUrls: ['./postcard.component.css'],
    encapsulation: ViewEncapsulation.None
})

export class PostcardComponent implements OnInit {
    @Input() post: Post;
    @Input() comments : boolean;

    commentPost: boolean = false;
    devMode: boolean = true;
    savePost: boolean = false;
    commandModeEnable: boolean = false;
    hidePost: boolean = false;
    reportPost: boolean = false;
    liked: boolean = false;
    name: any = '';
    icon: any = '';
    stagingImage: any = null;
    public showCommentInput:boolean = false;
    public buttonName:any = 'Show';

    textComment:string;
    postFormData: FormData;
    isFileSizeError: boolean =false;

    profileSmImage: any = 'assets/images/avatar1.png';
    isImageLoading: boolean = false;
    postImage: any = 'assets/images/avatar1.png';
    isPostImageLoading: boolean = false;
    entityId: string;
    numbers: number[] = [];
    todayDate : Date = new Date();
    postText : any;
    items: any;

    mentionConfig:any;
    onMentionSelect(item) {
      // return '#' + selection.label;
      return `@${item.username}`;
    }

    constructor(private postService: PostService,
                private dataShareService: DatashareService,
                private userService: UserService,
                private elementRef: ElementRef,
                private sanitizer: DomSanitizer,
                private router: Router) {
        for (let index = 0; index < 10000; index++) {
            this.numbers.push(index);
        }
        this.devMode = isDevMode();

        // if(document.getElementsByClassName("user")){
        //     const newLocal = "user";
        //     document.getElementsByClassName("user")[0].addEventListener("click", function(){
        //         console.log("test");
        //       })
        // }

        var element = document.getElementById('user');
        if(document.getElementById("user")){
            element.onclick = function() {
                console.log("test");
            }
        }



    }

    ngOnInit(): void {
        //this.getUsers();
        ////Get entity image
        if (this.post.postType) {
            this.postText = this.sanitizer.bypassSecurityTrustHtml(this.post.postText);
           // this.post.postText = postText;
            if (this.post.postType.indexOf('V') !== -1) {
                this.post['containsVideo'] = true;
            }
            if (this.post.postType.indexOf('I') !== -1) {
                this.post['containsImage'] = true;
                if (!this.devMode) {
                    this.getPostImage(this.post['relatedFiles'][0]);
                }
                //TODO
                //Get image
            }
            if (this.post.postType.indexOf('T') !== -1) {
                this.post['containsText'] = true;
            }
        }
        this.entityId = this.dataShareService.getLoggedinUsername();

        if (!this.devMode) {
            this.getProfileSmImage(this.entityId);
        }
    }

    
getUsers(){
    this.postService.getTagUsers()
    .subscribe((data:any) => {
        this.items = data;
        this.mentionConfig={triggerChar:'@',items:this.items, labelKey:'username',mentionSelect: this.onMentionSelect, insertHTML:false};

    });
}

    tagUsersRedirectTo(e){
        console.log(e.target.tagName);
        if(e.type == 'click' && e.target.tagName == 'SPAN'){
            let entityType = e.target.getAttribute("data-entityType");
            let routePath: string = '/'+entityType+'/';
            if(entityType == 'legislator')
                routePath= '/searchLegislator';
            else if(entityType == 'district')
                routePath= '/group';
    
            this.router.navigate([routePath]);
        }

    }

    save(val) {
        console.log(val);
        this.savePost = true;
        this.hidePost = false;
        this.reportPost = false;
        this.name = val;
        this.icon = 'fa fa-floppy-o';
    }

    like(event:any) {
        let entityId = this.dataShareService.getLoggedinUsername();
        if(this.post.likedBy.indexOf(entityId) == -1){
            let check = event.target.classList.contains('post-active');
            this.postService.postLike(entityId)
            .subscribe((data:any) => {
                event.target.classList.add('post-active');
                this.post.likedBy.push(entityId);
            });
        }
        
    }

    deleteAttachedFile(e) {
        this.postFormData = new FormData();
        this.stagingImage = '';
    }

    onFileSelected(event) {
        if (event.target.files && event.target.files[0]) {
            let filesizeMB = event.target.files[0].size/1024/1024;
            let fileType = event.target.files[0].type;
            if(filesizeMB <= 2.0 && (fileType == 'image/gif' || fileType == 'image/jpeg' || fileType == 'image/jpg' || fileType == 'image/png')){
                this.isFileSizeError = false;
                let reader = new FileReader();
                reader.readAsDataURL(event.target.files[0]); // read file as data url
          
                reader.onload = (event) => { // called once readAsDataURL is completed
                  this.stagingImage = event.target['result'];                
            }
            }
            else{
                this.isFileSizeError = true;
            }
          }
    }

    toggleCommentInput() {
        this.showCommentInput = !this.showCommentInput;

        // CHANGE THE NAME OF THE BUTTON.
        if(this.showCommentInput)
            this.buttonName = "Hide";
        else
            this.buttonName = "Show";
    }

    hide(val) {
        this.savePost = false;
        this.hidePost = true;
        this.reportPost = false;
        this.name = val;
        this.icon = 'fa fa-eye-slash';
    }

    report(val) {
        this.savePost = false;
        this.hidePost = false;
        this.reportPost = true;
        this.name = val;
        this.icon = 'fa fa-exclamation-triangle';
    }


    postEvent(): void {
        console.log("posting new message");
        this.commentPost = false;
    }


    makePostContent() {
        let withatAll = this.post.postText.replace(/(\r\n|\n|\r)/gm, "").split(" ");
        let replaceSpecial = [];
        for (var val of withatAll) {
            if(val.indexOf('@') >= 0){
                let tmp = val.split(/[,;?.\-_]/);
                for (var val1 of tmp) {
                    if(val1.indexOf('@') >= 0)
                    replaceSpecial.push(val1);
                }
                
            }
    
        }
        let content = this.post.postText.replace(/\n/g, '<br>');
        //content = content.replace('\r', '<br>');
        let replaceDone=[];
        for (var tmpreplace of replaceSpecial) {
            if(replaceDone.indexOf(tmpreplace) == -1){
                var tmpVal= tmpreplace.split('@');
                for(var i=0; i < this.items.length; i++) {
                    console.log(this.items[i].username);
                    if(this.items[i].username == tmpVal[1]) {
                        var tmphtml ="<span class='user' (click)='redirectTo('"+this.items[i].type+"')'>"+tmpreplace+'</span>';
                        content=content.replace(tmpreplace, tmphtml);
                        replaceDone.push(tmpreplace);
                    }
                }
                // var tmphtml ="<span class='user'>"+tmpreplace+'</span>';
                // content=content.replace(tmpreplace, tmphtml);
                // replaceDone.push(tmpreplace);
            }
    
        }
    
        console.log(content);
      //  .filter(t => t != "" && this.items.findIndex(u => u.name == t.trim()) > -1).map(name => this.items.find(s => s.name == name.trim()).id)
    
    //console.log(ids);
    
    }
    
    

    postComment() {
      
        // this.post.entityId = this.dataShareService.getLoggedinUsername();
        // this.post.postText = this.textComment;
        // this.postFormData = new FormData();
      //  this.postFormData.append('post', JSON.stringify(this.post));
      console.log(this.post);
      this.makePostContent();
         this.postService.postComment()
             .subscribe((data:any) => {
                 console.log(data);
                 this.toggleCommentInput();
                 if(this.post.comments){
                    this.post.comments.unshift(data);
                 }
                 else{
                     console.log("else")
                     this.post.comments = [];
                     this.post.comments.push(data);
                 }

             });
   }

   loadMoreComments(id: string) {
    this.postService.postComment()
    .subscribe((data:any) => {
        console.log(data);
            this.post.comments.push(data);

    });
   }

    comment(): void {
        this.commentPost = true;
        //child hideInput set to false
        console.log('this.commentPost ' + this.commentPost);
    }

    likePost(): void {
        console.log('Liked the post ' + this.post.id);
        console.log('userid ' + this.dataShareService.getCurrentUserId());
        this.post.likedByCurrentUser = true;
        console.log('this.post.likedByCurrentUser ' + this.post.likedByCurrentUser);
    }



    getProfileSmImage(userId: string) {
        this.isImageLoading = true;
        this.userService.getImage(userId).subscribe(data => {
            this.createImageFromBlob(data);
            this.isImageLoading = false;
        }, error => {
            this.isImageLoading = false;
            console.log(error);
        });
    }

    createImageFromBlob(image: Blob) {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            this.profileSmImage = reader.result;
        }, false);

        if (image) {
            reader.readAsDataURL(image);
        }
    }

    getPostImage(imageId: string) {
        this.isPostImageLoading = true;
        this.postService.getImage(imageId).subscribe(data => {
            this.createPostImageFromBlob(data);
            this.isPostImageLoading = false;
        }, error => {
            this.isPostImageLoading = false;
            console.log(error);
        });
    }

    createPostImageFromBlob(image: Blob) {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            this.postImage = reader.result;
        }, false);

        if (image) {
            reader.readAsDataURL(image);
        }
    }
}
