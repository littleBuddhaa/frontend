import { ProfileService } from '@app/core/profile/profile.service';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/internal/operators/finalize';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { User } from '@app/core/profile/user';
import { MatChipInputEvent } from '@angular/material';
import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormGroup, FormControl } from '@angular/forms';
import { ErrorHandlerService } from '@app/core/error-handler.service';

class ImageSnippet {
  constructor(public src: string, public file: File) {}
}

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DetailsComponent implements OnInit {
  user: User = new User();
  username: string;
  sociallinks: any = [];
  errorString: string;
  loggedInUsername: string;
  isFieldEditable = false;

  editForm: FormGroup;

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  listOfTech: any[];
  selectedFile: ImageSnippet;

  constructor(
    private profileService: ProfileService,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private errorHandler: ErrorHandlerService
  ) {
    this.username = this.route.snapshot.params.username;
    this.loggedInUsername = this.authenticationService.credentials.username;
  }

  ngOnInit() {
    this.editForm = new FormGroup({
      bio: new FormControl(),
      dob: new FormControl(),
      listOfTech: new FormControl([]),
      location: new FormControl(),
      website: new FormControl()
    });
    this.fetchUserContributions();
    this.profileService
      .getUserDetails()
      .pipe(finalize(() => {}))
      .subscribe(
        (data: any) => {
          if (data.length === 0) {
            this.router.navigate(['not-found']);
          }
          this.user = data[0];
          this.listOfTech = data[0].technologies;
          this.user.social_links.forEach(sociallink => {
            const username = sociallink.substr(sociallink.lastIndexOf('/') + 1, sociallink.length);
            if (sociallink.includes('facebook') || sociallink.includes('github') || sociallink.includes('twitter')) {
              const social =
                (sociallink.includes('facebook') && 'facebook') ||
                (sociallink.includes('github') && 'github') ||
                (sociallink.includes('twitter') && 'twitter');
              this.sociallinks.push({
                socialLink: sociallink,
                username: username,
                logoUrl: '../../../../assets/logos/social/' + social + '-logo.svg'
              });
            } else {
              this.sociallinks.push({
                socialLink: sociallink,
                username: sociallink,
                logoUrl: '../../../../assets/logos/grid-world.svg'
              });
            }
          });
        },
        (error: any) => {
          this.errorHandler.subj_notification.next(error);
        }
      );
  }

  toggleFormFields(toggle: boolean) {
    this.isFieldEditable = toggle;
  }

  onSubmit() {
    if (!this.selectedFile) {
      this.updateUserData(null);
    } else {
      this.profileService.uploadImage(this.selectedFile.file).subscribe(
        (res: any) => {
          const profileUrl = 'v' + res.version + '/' + res.public_id + '.' + res.format;
          this.updateUserData(profileUrl);
        },
        (err: any) => {
          this.errorHandler.subj_notification.next(err);
        }
      );
    }
  }

  updateUserData(profileUrl: string) {
    const userUpdateObject = {
      bio: this.editForm.get('bio').value,
      location: this.editForm.get('location').value,
      technologies: this.listOfTech,
      birth_date: this.editForm.get('dob').value,
      website: this.editForm.get('website').value,
      profile_pic: profileUrl
    };
    this.profileService
      .UpdateUserDetails(userUpdateObject)
      .pipe(finalize(() => {}))
      .subscribe(
        (data: any) => {
          location.reload();
        },
        (error: any) => {
          this.errorHandler.subj_notification.next(error);
        }
      );
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      this.listOfTech.push(value.trim());
      console.log(this.listOfTech);
    }
    if (input) {
      input.value = '';
    }
  }

  processFile(imageInput: any) {
    const file: File = imageInput.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', (event: any) => {
      this.selectedFile = new ImageSnippet(event.target.result, file);
    });
    reader.readAsDataURL(file);
  }

  remove(tech: string): void {
    const index = this.listOfTech.indexOf(tech);
    if (index >= 0) {
      this.listOfTech.splice(index, 1);
    }
  }

  fetchUserContributions() {
    this.profileService
      .getUserContributions()
      .pipe(finalize(() => {}))
      .subscribe(
        (data: any) => {
          this.user.idea_list = data.idea_list;
          this.user.project_list = data.project_list;
        },
        (error: any) => {
          this.errorHandler.subj_notification.next(error);
        }
      );
  }
}
