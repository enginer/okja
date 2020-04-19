import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController, ToastController, ModalController } from '@ionic/angular';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileService } from '../../../services/profile.service';
import { TranslateConfigService } from '../../../services/translate-config.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserDataService } from '../../../services/user-data.service';
import { Roles } from 'models/enums/roles.enum';
import { Profile } from 'models/class/profile';
import { PositionPikerComponent } from 'modules/user/position-piker/position-piker.component';
import { LoaderService } from 'services/loader.service';
import { AvailabilityType } from "../../../models/enums/availability.enum";
import {Router} from "@angular/router";

@Component({
  selector: 'user-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {

  // Binding
  public Page = {
    help: Roles
  }

  public availabilityList: AvailabilityType[] = [];
  public availability: AvailabilityType;
  public showInfo = true;
  public profile: Profile;
  public hasProfile = false;
  public distance: number;

  constructor(
    private readonly router: Router,
    private readonly loaderService: LoaderService,
    private readonly userDataService: UserDataService,
    private readonly profileService: ProfileService,
    private readonly translateConfigService: TranslateConfigService,
    private readonly navCtrl: NavController,
    private readonly toast: ToastController,
    private readonly modalController: ModalController
  ) {
    this.translateConfigService.getDefaultLanguage();

    Object.keys(AvailabilityType).forEach((type) => {
      this.availabilityList.push(AvailabilityType[type]);
    });
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {

  }


  ionViewDidEnter() {
    this.onEnter();
  }

  async onEnter() {
    await this.loaderService.showLoader();
    this.showInfo = true;
    this.getProfile()
    await this.loaderService.hideLoader();
  }


  public onClickHideInfo() {
    const p = this.profile.position;
    if (p && p.lat && p.lat !== 0 && p.lng && p.lng !== 0) {
      this.showInfo = false;

    } else {
      const message = this.translateConfigService.translateInstant('PROFILE_PAGE.SET_POSITION_MESSAGE');
      this.showToast(message);
    }
  }

  public async saveProfile() {
    await this.loaderService.showLoader();
    await this.profileService.addProfile(this.profile).toPromise()
    await this.loaderService.hideLoader();
    this.navCtrl.navigateRoot('home/tabs/map');
  }

  async showModalPosiont() {
    const modal = await this.modalController.create({
      component: PositionPikerComponent,
      componentProps: {
        profile: this.profile
      },
      swipeToClose: true,
      showBackdrop: true,
    });
    modal.present();
    const detail = await modal.onDidDismiss();
    this.profile = detail.data.profile;
  }

  public toggleCapability(role: Roles) {
    const val = !this.getCapability(role);
    this.profileService.setCapability(this.profile, role, val);
  }
  public getCapability(role: Roles) {
    return this.profileService.getCapability(this.profile, role);
  }

  public getCapabilityClass(role: Roles) {
    return this.getCapability(role) ? 'cap-enabled' : '';
  }

  public getAvaibleClass() {
    return this.profile.isAvailable ? 'cap-enabled' : '';
  }

  public toggleIsAvaible() {
    this.profile.isAvailable = !this.profile.isAvailable
    if (this.profile.isAvailable) {
      this.profile.isHelper = true;
    }
  }

  public onChangeAvailability(type) {
    this.availability = type;
  }

  public onChangeDistance() {
    if (this.distance === 0) {
      this.distance = 1;
    } else if (this.distance > 10) {
      this.distance = 9999;
    }
  }

  // ------------- PRIVATE METHODS --------------//
  // --------------------------------------------//

  private getProfile() {
    return this.profileService.getProfile()
      .pipe(
        switchMap(profile => this.getProfileSwitchMap(profile)),
        untilDestroyed(this)
      )
      .subscribe({
        next: profile => this.profile = profile
      });
  }

  private getProfileSwitchMap(profile: Profile) {
    if (profile) {
      this.hasProfile = true;
      return of(profile);
    } else {
      return this.userDataService.getUser().pipe(map(user => {
        this.hasProfile = false;
        profile = new Profile();
        this.profileService.setProfileByUser(profile, user);
        return profile;
      }));
    }
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({ message })
    t.present();
    setTimeout(() => {
      t.dismiss();
    }, 2000);
  }

  goToSettings() {
    this.router.navigate(['tabs/settings'])
  }
}


